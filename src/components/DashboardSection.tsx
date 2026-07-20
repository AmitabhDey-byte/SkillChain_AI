import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleAlert,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  FileCheck2,
  GitBranch,
  Globe2,
  Lightbulb,
  LockKeyhole,
  LoaderCircle,
  Network,
  Rocket,
  ShieldCheck,
  Share2,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react'
import { type CSSProperties, useState } from 'react'
import {
  issueCredential,
  type AssessmentRunResult,
  type CredentialIssueResponse,
  type DimensionScore,
  type GithubRepository,
} from '../lib/api'
import { buildVerificationUrl, createCredentialPassport, downloadJson } from '../lib/credentialSharing'
import type { OnboardingProfile } from '../lib/onboarding'
import { shortenAddress, type WalletConnection } from '../lib/wallet'
import { CredentialVerifier } from './CredentialVerifier'
import { JobMarketplace } from './JobMarketplace'
import { Avatar } from './Avatar'

export type DashboardSectionName = 'Overview' | 'Skill graph' | 'Opportunities' | 'Assessments' | 'Credentials' | 'Career copilot' | 'Verification' | 'Public profile' | 'Settings'

type DashboardSectionProps = {
  section: Exclude<DashboardSectionName, 'Overview'>
  profile: OnboardingProfile
  connection: WalletConnection | null
  assessmentResult: AssessmentRunResult | null
  credential: CredentialIssueResponse | null
  repositories: GithubRepository[]
  onNewAssessment: () => void
  onViewAssessment: () => void
  onOpenWallet: () => void
  onCredentialIssued: (credential: CredentialIssueResponse) => void
  opportunityQuery: string
  opportunitySearchKey: number
}

function AssessmentsSection({
  assessmentResult,
  repositories,
  onNewAssessment,
  onViewAssessment,
}: Pick<DashboardSectionProps, 'assessmentResult' | 'repositories' | 'onNewAssessment' | 'onViewAssessment'>) {
  return (
    <>
      <div className="workspace-heading"><div><p className="overline">AI VERIFICATION</p><h1>Assessments</h1><p>Turn selected public repositories into a transparent, evidence-backed skill report.</p></div><button className="button button--primary" type="button" onClick={onNewAssessment}><Sparkles size={17} /> New assessment</button></div>
      {assessmentResult ? (
        <article className="workspace-feature-card assessment-history-card">
          <div className="history-score"><strong>{assessmentResult.assessment.overall_score}</strong><span>/100</span></div>
          <div><span className="workspace-status workspace-status--complete"><Check size={12} /> Complete</span><h2>{assessmentResult.assessment.level} technical profile</h2><p>{assessmentResult.assessment.summary}</p><div className="history-meta"><span><GitBranch size={13} /> {assessmentResult.evidence_summary.successful} repositories</span><span><Code2 size={13} /> {assessmentResult.assessment.skills.length} verified skills</span><span><ShieldCheck size={13} /> {Math.round(assessmentResult.assessment.confidence * 100)}% confidence</span></div></div>
          <button className="button button--workspace" type="button" onClick={onViewAssessment}>Open report <ArrowRight size={16} /></button>
        </article>
      ) : (
        <article className="workspace-empty-card"><span><Sparkles size={28} /></span><h2>No completed assessment yet</h2><p>{repositories.length ? `${repositories.length} repositories are saved in your draft. Continue to collect evidence and generate your report.` : 'Choose one to five repositories that best demonstrate your technical work.'}</p><button className="button button--primary" type="button" onClick={onNewAssessment}>{repositories.length ? 'Continue draft' : 'Choose repositories'} <ArrowRight size={16} /></button></article>
      )}
    </>
  )
}

function CredentialsSection({
  assessmentResult,
  connection,
  credential,
  onNewAssessment,
  onCredentialIssued,
}: Pick<
  DashboardSectionProps,
  'assessmentResult' | 'connection' | 'credential' | 'onNewAssessment' | 'onCredentialIssued'
>) {
  const [status, setStatus] = useState<'idle' | 'issuing' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const legacyAssessment = assessmentResult
    && (!assessmentResult.attestation || !assessmentResult.subject_wallet || !assessmentResult.github_username)

  const issue = async () => {
    if (!assessmentResult || !connection) return
    setStatus('issuing')
    setError(null)

    try {
      const issuedCredential = await issueCredential(connection.address, assessmentResult)
      onCredentialIssued(issuedCredential)
      setStatus('idle')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Credential issuance could not be completed.')
      setStatus('error')
    }
  }

  const copyCredentialId = async () => {
    if (!credential) return
    await navigator.clipboard.writeText(credential.credential_id)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const shareCredential = async () => {
    if (!credential) return
    const url = buildVerificationUrl(credential.credential_id, credential.owner)
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'SkillChain verified credential',
          text: `Verify my ${credential.level} technical credential on Stellar.`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
      await navigator.clipboard.writeText(url)
    }
    setShared(true)
    window.setTimeout(() => setShared(false), 1800)
  }

  const downloadPassport = () => {
    if (!credential) return
    downloadJson(
      `skillchain-passport-${credential.credential_id.slice(0, 12)}.json`,
      createCredentialPassport(credential),
    )
  }

  if (credential) {
    const explorerUrl = `https://stellar.expert/explorer/${credential.network}/tx/${credential.transaction_hash}`
    return (
      <>
        <div className="workspace-heading"><div><p className="overline">STELLAR CREDENTIALS</p><h1>Credentials</h1><p>Your verified skill credential is active and publicly verifiable on Stellar.</p></div></div>
        <article className="credential-issued-card">
          <div className="credential-issued-header"><span><BadgeCheck size={31} /></span><div><p className="overline">ON-CHAIN CREDENTIAL ACTIVE</p><h2>{credential.level} technical credential</h2><p>Issued to {shortenAddress(credential.owner)} with a verified score of {credential.score}/100.</p></div><strong>{credential.score}</strong></div>
          <dl><div><dt>Credential ID</dt><dd>{credential.credential_id}</dd></div><div><dt>Transaction</dt><dd>{credential.transaction_hash}</dd></div><div><dt>Network</dt><dd>{credential.network}</dd></div><div><dt>Ledger</dt><dd>{credential.ledger_sequence || 'Confirmed'}</dd></div></dl>
          <div className="credential-share-callout"><Share2 size={19} /><div><strong>Recruiter-ready proof</strong><span>Share a link that automatically checks this credential against Stellar.</span></div><button type="button" onClick={() => void shareCredential()}>{shared ? <><Check size={14} /> Shared</> : <><Share2 size={14} /> Share verification</>}</button></div>
          <div className="credential-issued-actions">
            <button className="button button--workspace" type="button" onClick={() => void copyCredentialId()}><Clipboard size={15} /> {copied ? 'Copied' : 'Copy ID'}</button>
            <button className="button button--workspace" type="button" onClick={downloadPassport}><Download size={15} /> Download passport</button>
            <a className="button button--primary" href={explorerUrl} target="_blank" rel="noreferrer">View transaction <ExternalLink size={15} /></a>
          </div>
        </article>
      </>
    )
  }

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">STELLAR CREDENTIALS</p><h1>Credentials</h1><p>Manage portable, tamper-proof skill credentials owned by your Stellar wallet.</p></div></div>
      <article className={assessmentResult ? 'credential-readiness credential-readiness--ready' : 'credential-readiness'}>
        <span>{assessmentResult ? <BadgeCheck size={29} /> : <LockKeyhole size={29} />}</span>
        <div><p className="overline">{legacyAssessment ? 'NEW ASSESSMENT REQUIRED' : assessmentResult ? 'READY FOR ISSUANCE' : 'ASSESSMENT REQUIRED'}</p><h2>{legacyAssessment ? 'Refresh your report for secure issuance.' : assessmentResult ? 'Your AI report is credential-ready.' : 'Complete verification before issuing.'}</h2><p>{legacyAssessment ? 'This report predates signed assessment attestations. Run a fresh assessment before issuing it on-chain.' : assessmentResult ? `The validated score of ${assessmentResult.assessment.overall_score}/100 will be anchored to ${connection ? shortenAddress(connection.address) : 'your connected wallet'}.` : 'On-chain credentials require a completed, validated SkillChain AI assessment.'}</p></div>
        {legacyAssessment ? <button className="button button--workspace" type="button" onClick={onNewAssessment}>Run fresh assessment <ArrowRight size={16} /></button> : assessmentResult ? <button className="button button--primary" type="button" onClick={() => void issue()} disabled={status === 'issuing' || !connection}>{status === 'issuing' ? <><LoaderCircle className="spin" size={16} /> Issuing on Stellar</> : <>Issue credential <ArrowRight size={16} /></>}</button> : <button className="button button--workspace" type="button" disabled>Credential locked</button>}
      </article>
      {error && <div className="credential-error" role="alert"><CircleAlert size={18} /><div><strong>Issuance was not completed</strong><span>{error}</span></div></div>}
      <div className="credential-benefit-grid"><article><ShieldCheck /><strong>Tamper-proof</strong><span>Verification data is anchored to Stellar.</span></article><article><Wallet /><strong>Wallet-owned</strong><span>Your professional identity remains portable.</span></article><article><Globe2 /><strong>Publicly verifiable</strong><span>Recruiters can validate it instantly.</span></article></div>
    </>
  )
}

function VerificationSection({
  connection,
  credential,
}: Pick<DashboardSectionProps, 'connection' | 'credential'>) {
  return (
    <>
      <div className="workspace-heading"><div><p className="overline">PUBLIC VERIFICATION</p><h1>Verify a credential</h1><p>Check a SkillChain credential ID against its Stellar wallet owner.</p></div></div>
      <CredentialVerifier initialCredentialId={credential?.credential_id} initialOwner={credential?.owner || connection?.address} />
      <div className="verification-guide"><FileCheck2 size={24} /><div><strong>Instant cryptographic verification</strong><p>The verification gateway checks ownership and revocation status directly against the configured Stellar credential contract.</p></div></div>
    </>
  )
}

function SkillGraphSection({
  assessmentResult,
  onNewAssessment,
}: Pick<DashboardSectionProps, 'assessmentResult' | 'onNewAssessment'>) {
  if (!assessmentResult) {
    return (
      <>
        <div className="workspace-heading"><div><p className="overline">SKILL INTELLIGENCE</p><h1>Skill graph</h1><p>Map the strongest relationships across your technical evidence.</p></div></div>
        <article className="workspace-empty-card"><span><Network size={28} /></span><h2>Your graph needs evidence</h2><p>Complete an AI portfolio assessment to generate your evidence-backed skill constellation.</p><button className="button button--primary" type="button" onClick={onNewAssessment}>Build my graph <ArrowRight size={16} /></button></article>
      </>
    )
  }

  const dimensions = Object.entries(assessmentResult.assessment.dimensions) as Array<[string, DimensionScore]>
  const skills = assessmentResult.assessment.skills.slice(0, 8)

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">SKILL INTELLIGENCE</p><h1>Skill graph</h1><p>A visual map grounded in your latest Gemini evidence assessment.</p></div><span className="workspace-status workspace-status--complete"><Check size={12} /> {Math.round(assessmentResult.assessment.confidence * 100)}% confidence</span></div>
      <div className="skill-graph-layout">
        <article className="skill-constellation">
          <div className="skill-constellation__core"><strong>{assessmentResult.assessment.overall_score}</strong><span>PROOF SCORE</span></div>
          {skills.map((skill, index) => {
            const angle = (index / Math.max(skills.length, 1)) * Math.PI * 2
            const radius = index % 2 === 0 ? 38 : 46
            const style = {
              '--skill-x': `${50 + Math.cos(angle) * radius}%`,
              '--skill-y': `${50 + Math.sin(angle) * radius}%`,
              '--skill-delay': `${index * -0.4}s`,
            } as CSSProperties
            return <span className="skill-node" style={style} key={skill.name}><b>{skill.name}</b><small>{Math.round(skill.confidence * 100)}%</small></span>
          })}
          <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="31" /><circle cx="50" cy="50" r="43" /></svg>
        </article>
        <article className="dimension-ledger">
          <div><p className="overline">CAPABILITY LEDGER</p><h2>Assessment dimensions</h2></div>
          {dimensions.map(([name, value]) => (
            <div className="dimension-row" key={name}>
              <span>{name.replaceAll('_', ' ')}</span><strong>{value.score}</strong>
              <i><b style={{ width: `${value.score}%` }} /></i>
              <small>{value.rationale}</small>
            </div>
          ))}
        </article>
      </div>
    </>
  )
}

function CareerCopilotSection({
  assessmentResult,
  onNewAssessment,
}: Pick<DashboardSectionProps, 'assessmentResult' | 'onNewAssessment'>) {
  const [targetRole, setTargetRole] = useState('Senior product engineer')
  const [generatedFor, setGeneratedFor] = useState('')

  if (!assessmentResult) {
    return (
      <>
        <div className="workspace-heading"><div><p className="overline">AI CAREER COPILOT</p><h1>Career copilot</h1><p>Turn verified evidence into a focused growth strategy.</p></div></div>
        <article className="workspace-empty-card"><span><Sparkles size={28} /></span><h2>Complete an assessment first</h2><p>Your copilot grounds every recommendation in your verified strengths and evidence gaps.</p><button className="button button--primary" type="button" onClick={onNewAssessment}>Start assessment <ArrowRight size={16} /></button></article>
      </>
    )
  }

  const strongestSkills = assessmentResult.assessment.skills.slice(0, 3)
  const nextSteps = assessmentResult.assessment.next_steps.slice(0, 4)

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">AI CAREER COPILOT</p><h1>Career copilot</h1><p>Build a role-specific growth plan grounded in your latest Gemini assessment.</p></div></div>
      <section className="copilot-studio">
        <div className="copilot-prompt">
          <span><Sparkles /></span>
          <div><p>CAREER TARGET</p><h2>Where do you want your proof to take you?</h2></div>
          <label><Target size={17} /><input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} maxLength={120} /><button type="button" onClick={() => setGeneratedFor(targetRole.trim())} disabled={!targetRole.trim()}>Generate path <Rocket size={15} /></button></label>
          <small><ShieldCheck size={13} /> Uses your assessment locally. No additional AI request or cost.</small>
        </div>
        <div className="copilot-output">
          {!generatedFor ? (
            <div className="copilot-idle"><Lightbulb size={29} /><strong>Your strategy will appear here</strong><span>Set a target role to transform your evidence into a practical roadmap.</span></div>
          ) : (
            <>
              <div className="copilot-output__head"><p>PATH TO</p><h2>{generatedFor}</h2><span>{assessmentResult.assessment.level} foundation · {assessmentResult.assessment.overall_score}/100 proof score</span></div>
              <div className="copilot-strengths">{strongestSkills.map((skill) => <span key={skill.name}><Check size={12} /> Lead with {skill.name}</span>)}</div>
              <ol>{nextSteps.map((step, index) => <li key={step}><b>0{index + 1}</b><span>{step}</span></li>)}</ol>
              <div className="copilot-sprint"><Rocket size={17} /><div><strong>30-day proof sprint</strong><span>Ship one public artifact that combines {strongestSkills.slice(0, 2).map((skill) => skill.name).join(' + ')} and document measurable impact.</span></div></div>
            </>
          )}
        </div>
      </section>
    </>
  )
}

function PublicProfileSection({
  profile,
  connection,
  assessmentResult,
}: Pick<DashboardSectionProps, 'profile' | 'connection' | 'assessmentResult'>) {
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (!connection) return
    await navigator.clipboard.writeText(connection.address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">PROFESSIONAL IDENTITY</p><h1>Public profile</h1><p>Preview the identity recruiters and clients will use to verify your work.</p></div></div>
      <article className="public-profile-card">
        <div className="public-profile-cover"><span>SKILLCHAIN PASSPORT</span><BadgeCheck size={22} /></div>
        <div className="public-profile-body">
          <Avatar name={profile.displayName} githubUsername={profile.githubUsername} size="large" />
          <div className="public-profile-title"><div><h2>{profile.displayName}</h2><p>{profile.headline}</p><span>{profile.location || 'Location not specified'} · @{profile.githubUsername}</span></div>{assessmentResult && <div><strong>{assessmentResult.assessment.overall_score}</strong><span>{assessmentResult.assessment.level}</span></div>}</div>
          <div className="public-profile-stats"><div><strong>{assessmentResult?.assessment.skills.length || 0}</strong><span>Verified skills</span></div><div><strong>{assessmentResult?.evidence_summary.successful || 0}</strong><span>Projects analyzed</span></div><div><strong>{assessmentResult ? `${Math.round(assessmentResult.assessment.confidence * 100)}%` : '—'}</strong><span>AI confidence</span></div></div>
          <div className="public-wallet-row"><Wallet size={16} /><span>{connection ? shortenAddress(connection.address) : 'Wallet unavailable'}</span><button type="button" onClick={() => void copyAddress()} disabled={!connection}><Clipboard size={14} /> {copied ? 'Copied' : 'Copy address'}</button></div>
        </div>
      </article>
    </>
  )
}

function SettingsSection({
  connection,
  onOpenWallet,
}: Pick<DashboardSectionProps, 'connection' | 'onOpenWallet'>) {
  const [publicProfile, setPublicProfile] = useState(() => localStorage.getItem('skillchain.settings.publicProfile') !== 'false')
  const [productUpdates, setProductUpdates] = useState(() => localStorage.getItem('skillchain.settings.productUpdates') === 'true')

  const updateSetting = (key: string, value: boolean, setter: (next: boolean) => void) => {
    localStorage.setItem(key, String(value))
    setter(value)
  }

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">ACCOUNT PREFERENCES</p><h1>Settings</h1><p>Control profile visibility, notifications, and your connected Stellar identity.</p></div></div>
      <div className="settings-grid">
        <article><div className="settings-title"><span><Globe2 size={18} /></span><div><strong>Public profile</strong><small>Allow recruiters to view your issued credentials.</small></div></div><button className={publicProfile ? 'settings-toggle settings-toggle--on' : 'settings-toggle'} type="button" aria-pressed={publicProfile} onClick={() => updateSetting('skillchain.settings.publicProfile', !publicProfile, setPublicProfile)}><span /></button></article>
        <article><div className="settings-title"><span><Sparkles size={18} /></span><div><strong>Product updates</strong><small>Receive important SkillChain release notifications.</small></div></div><button className={productUpdates ? 'settings-toggle settings-toggle--on' : 'settings-toggle'} type="button" aria-pressed={productUpdates} onClick={() => updateSetting('skillchain.settings.productUpdates', !productUpdates, setProductUpdates)}><span /></button></article>
        <article className="settings-wallet-card"><div className="settings-title"><span><Wallet size={18} /></span><div><strong>Connected wallet</strong><small>{connection ? shortenAddress(connection.address) : 'No wallet session'}</small></div></div><button className="button button--workspace" type="button" onClick={onOpenWallet}>Manage wallet</button></article>
      </div>
    </>
  )
}

export function DashboardSection(props: DashboardSectionProps) {
  if (props.section === 'Skill graph') return <SkillGraphSection {...props} />
  if (props.section === 'Opportunities') return <JobMarketplace key={props.opportunitySearchKey} profile={props.profile} connection={props.connection} assessmentResult={props.assessmentResult} initialQuery={props.opportunityQuery} />
  if (props.section === 'Assessments') return <AssessmentsSection {...props} />
  if (props.section === 'Credentials') return <CredentialsSection {...props} />
  if (props.section === 'Career copilot') return <CareerCopilotSection {...props} />
  if (props.section === 'Verification') return <VerificationSection {...props} />
  if (props.section === 'Public profile') return <PublicProfileSection {...props} />
  return <SettingsSection {...props} />
}
