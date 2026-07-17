import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Code2,
  FileSearch,
  GitBranch,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  X,
} from 'lucide-react'
import { type CSSProperties, useEffect, useState } from 'react'
import {
  ApiError,
  collectGithubEvidence,
  previewSkillAssessment,
  type AssessmentRunResult,
  type GithubRepository,
} from '../lib/api'
import { saveAssessmentResult } from '../lib/assessmentResult'

type AssessmentExperienceProps = {
  githubUsername: string
  repositories: GithubRepository[]
  existingResult: AssessmentRunResult | null
  onClose: () => void
  onComplete: (result: AssessmentRunResult) => void
  onCredentialStep: () => void
}

type RunnerStatus = 'collecting' | 'analyzing' | 'complete' | 'error'

const dimensionDetails = [
  { key: 'code_quality', label: 'Code quality', weight: '25%' },
  { key: 'architecture', label: 'Architecture', weight: '20%' },
  { key: 'documentation', label: 'Documentation', weight: '15%' },
  { key: 'consistency', label: 'Consistency', weight: '15%' },
  { key: 'complexity', label: 'Complexity', weight: '15%' },
  { key: 'impact', label: 'Impact', weight: '10%' },
] as const

function confidenceLabel(confidence: number) {
  if (confidence >= 0.85) return 'High confidence'
  if (confidence >= 0.65) return 'Good confidence'
  return 'Limited evidence'
}

export function AssessmentExperience({
  githubUsername,
  repositories,
  existingResult,
  onClose,
  onComplete,
  onCredentialStep,
}: AssessmentExperienceProps) {
  const [status, setStatus] = useState<RunnerStatus>(existingResult ? 'complete' : 'collecting')
  const [result, setResult] = useState<AssessmentRunResult | null>(existingResult)
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null)
  const [runVersion, setRunVersion] = useState(0)
  const [expandedDimension, setExpandedDimension] = useState<string | null>('code_quality')

  useEffect(() => {
    if (existingResult) return
    const controller = new AbortController()

    collectGithubEvidence(repositories, controller.signal)
      .then((evidenceBatch) => {
        const evidence = evidenceBatch.items.flatMap((item) => item.evidence ? [item.evidence] : [])
        if (evidence.length === 0) throw new Error('No selected repository could provide enough public evidence for analysis.')
        setStatus('analyzing')
        return previewSkillAssessment(githubUsername, evidence, controller.signal).then((assessment) => ({ evidenceBatch, assessment }))
      })
      .then(({ evidenceBatch, assessment }) => {
        const completedResult: AssessmentRunResult = {
          ...assessment,
          evidence_summary: {
            successful: evidenceBatch.successful,
            failed: evidenceBatch.failed,
            unavailable_sources: [...new Set(evidenceBatch.items.flatMap((item) => item.unavailable_sources))],
          },
          repository_ids: repositories.map((repository) => repository.github_repository_id),
          completed_at: new Date().toISOString(),
        }
        saveAssessmentResult(completedResult)
        setResult(completedResult)
        setStatus('complete')
        onComplete(completedResult)
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
        const apiError = caughtError instanceof ApiError ? caughtError : null
        setError({
          message: caughtError instanceof Error ? caughtError.message : 'The assessment could not be completed.',
          requestId: apiError?.requestId,
        })
        setStatus('error')
      })

    return () => controller.abort()
  }, [existingResult, githubUsername, onComplete, repositories, runVersion])

  const retry = () => {
    setError(null)
    setStatus('collecting')
    setRunVersion((current) => current + 1)
  }

  if (status !== 'complete' || !result) {
    return (
      <div className="modal-backdrop assessment-backdrop" role="presentation">
        <section className="assessment-runner" role="dialog" aria-modal="true" aria-labelledby="assessment-running-title">
          <button className="modal-close" type="button" aria-label="Close assessment" onClick={onClose}><X size={19} /></button>
          {status === 'error' ? (
            <div className="assessment-error-state">
              <span><AlertTriangle size={27} /></span>
              <p className="overline">ASSESSMENT INTERRUPTED</p>
              <h2 id="assessment-running-title">We couldn’t finish the analysis.</h2>
              <p>{error?.message}</p>
              {error?.requestId && <small>Request ID: {error.requestId}</small>}
              <div><button className="button button--primary" type="button" onClick={retry}><RefreshCw size={16} /> Try again</button><button className="back-button" type="button" onClick={onClose}>Return to dashboard</button></div>
            </div>
          ) : (
            <div className="assessment-running-state">
              <div className="assessment-orbit"><span><BrainCircuit size={34} /></span><i /><i /><i /></div>
              <p className="overline">AI VERIFICATION IN PROGRESS</p>
              <h2 id="assessment-running-title">{status === 'collecting' ? 'Gathering trusted evidence.' : 'Evaluating your technical work.'}</h2>
              <p>{status === 'collecting' ? `Reading public signals from ${repositories.length} selected ${repositories.length === 1 ? 'repository' : 'repositories'}.` : 'Gemini is applying SkillChain’s transparent six-dimension rubric.'}</p>
              <div className="assessment-phase-list">
                <div className={status === 'collecting' ? 'active' : 'complete'}><span>{status === 'collecting' ? <LoaderCircle className="spin" size={16} /> : <Check size={15} />}</span><div><strong>Collect repository evidence</strong><small>Languages, README, commits, tests, and documentation</small></div></div>
                <div className={status === 'analyzing' ? 'active' : ''}><span>{status === 'analyzing' ? <LoaderCircle className="spin" size={16} /> : '2'}</span><div><strong>Apply AI skill rubric</strong><small>Evidence-backed scoring across six dimensions</small></div></div>
                <div><span>3</span><div><strong>Validate structured report</strong><small>Server-controlled score and confidence checks</small></div></div>
              </div>
              <div className="assessment-repository-chips">{repositories.map((repository) => <span key={repository.github_repository_id}><GitBranch size={12} /> {repository.name}</span>)}</div>
              <small className="assessment-time-note">This usually takes 20–45 seconds. You can safely keep this window open.</small>
            </div>
          )}
        </section>
      </div>
    )
  }

  const assessment = result.assessment

  return (
    <div className="assessment-report" role="dialog" aria-modal="true" aria-labelledby="assessment-report-title">
      <header className="report-topbar">
        <button type="button" onClick={onClose}><ArrowLeft size={16} /> Dashboard</button>
        <div><Sparkles size={16} /><strong>SkillChain AI Report</strong><span>Verified analysis</span></div>
        <button type="button" onClick={onClose}><X size={18} /></button>
      </header>

      <main className="report-content">
        <section className="report-hero">
          <div className="report-score" style={{ '--score': `${assessment.overall_score * 3.6}deg` } as CSSProperties}><div><strong>{assessment.overall_score}</strong><span>/100</span></div></div>
          <div className="report-hero-copy">
            <p className="overline">PORTFOLIO ASSESSMENT COMPLETE</p>
            <h1 id="assessment-report-title">{assessment.level} technical profile.</h1>
            <p>{assessment.summary}</p>
            <div><span><ShieldCheck size={14} /> {confidenceLabel(assessment.confidence)} · {Math.round(assessment.confidence * 100)}%</span><span><GitBranch size={14} /> {result.evidence_summary.successful} repositories analyzed</span><span><BadgeCheck size={14} /> {result.rubric_version}</span></div>
          </div>
          <div className="report-hero-action"><span>Generated with</span><strong>{result.model}</strong><small>{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(result.completed_at))}</small></div>
        </section>

        {result.evidence_summary.failed > 0 && (
          <div className="report-warning"><TriangleAlert size={17} /><span>{result.evidence_summary.failed} selected repository could not be analyzed. The report uses the remaining evidence and adjusts confidence accordingly.</span></div>
        )}

        <section className="report-section">
          <div className="report-section-heading"><div><p className="overline">SCORING BREAKDOWN</p><h2>How your score was calculated</h2></div><p>Every dimension uses a fixed weight. Expand a row to review the rationale and evidence.</p></div>
          <div className="dimension-list">
            {dimensionDetails.map(({ key, label, weight }) => {
              const dimension = assessment.dimensions[key]
              const expanded = expandedDimension === key
              return (
                <article className={expanded ? 'dimension-row dimension-row--expanded' : 'dimension-row'} key={key}>
                  <button type="button" onClick={() => setExpandedDimension(expanded ? null : key)}>
                    <span>{label}<small>{weight} weight</small></span>
                    <div><span><i style={{ width: `${dimension.score}%` }} /></span><strong>{dimension.score}</strong><ChevronDown size={16} /></div>
                  </button>
                  {expanded && <div className="dimension-detail"><p>{dimension.rationale}</p><ul>{dimension.evidence.map((item) => <li key={item}><CircleDot size={12} /> {item}</li>)}</ul></div>}
                </article>
              )
            })}
          </div>
        </section>

        <section className="report-section">
          <div className="report-section-heading"><div><p className="overline">VERIFIED SKILL SIGNALS</p><h2>Skills demonstrated by evidence</h2></div><p>Confidence reflects the quantity and quality of public evidence available.</p></div>
          <div className="skill-signal-grid">
            {assessment.skills.map((skill) => (
              <article key={`${skill.category}-${skill.name}`}><div><span><Code2 size={17} /></span><small>{Math.round(skill.confidence * 100)}% confidence</small></div><h3>{skill.name}</h3><p>{skill.category}</p><div><strong>{skill.level}</strong><span>{skill.evidence[0]}</span></div></article>
            ))}
          </div>
        </section>

        <section className="report-section">
          <div className="report-section-heading"><div><p className="overline">REPOSITORY FINDINGS</p><h2>Evidence by project</h2></div></div>
          <div className="finding-list">
            {assessment.repository_findings.map((finding) => (
              <article key={finding.repository}>
                <div className="finding-title"><span><GitBranch size={17} /></span><div><strong>{finding.repository}</strong><small>{finding.technologies.join(' · ')}</small></div><div><strong>{finding.complexity_score}</strong><span>Complexity</span></div></div>
                <div className="finding-columns"><div><h4><TrendingUp size={14} /> Strengths</h4><ul>{finding.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h4><Target size={14} /> Improvements</h4><ul>{finding.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
              </article>
            ))}
          </div>
        </section>

        <section className="report-insight-grid">
          <article><span><CheckCircle2 size={19} /></span><h3>Portfolio strengths</h3><ul>{assessment.portfolio_strengths.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><span><FileSearch size={19} /></span><h3>Evidence limitations</h3><ul>{assessment.risk_flags.length ? assessment.risk_flags.map((item) => <li key={item}>{item}</li>) : <li>No material evidence limitations found.</li>}</ul></article>
          <article><span><Lightbulb size={19} /></span><h3>Recommended next steps</h3><ul>{assessment.next_steps.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </section>

        <section className="report-methodology"><ShieldCheck size={18} /><div><strong>Transparent methodology</strong><p>{assessment.methodology}</p></div><span>{result.usage.total_tokens.toLocaleString()} AI tokens</span></section>
      </main>

      <footer className="report-footer"><div><BadgeCheck size={17} /><span><strong>Assessment ready for credential issuance</strong><small>Your report has been validated and saved.</small></span></div><button className="button button--primary" type="button" onClick={onCredentialStep}>Continue to credential <ArrowRight size={17} /></button></footer>
    </div>
  )
}
