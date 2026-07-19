import { BadgeCheck, Bookmark, BriefcaseBusiness, Check, ChevronDown, CircleAlert, Clock3, LoaderCircle, MapPin, Search, Send, SlidersHorizontal, Sparkles, Wallet, X } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { filterJobVacancies, jobVacancies, type JobVacancy } from '../data/jobs'
import { submitJobApplication, type AssessmentRunResult } from '../lib/api'
import { loadApplicationReceipts, saveApplicationReceipt } from '../lib/applicationReceipts'
import type { OnboardingProfile } from '../lib/onboarding'
import type { WalletConnection } from '../lib/wallet'

const savedJobsKey = 'skillchain.jobs.saved'

function loadSavedJobs() {
  const saved = localStorage.getItem(savedJobsKey)
  if (!saved) return new Set<string>()
  try {
    return new Set<string>(JSON.parse(saved))
  } catch {
    return new Set<string>()
  }
}

type JobMarketplaceProps = {
  profile: OnboardingProfile
  connection: WalletConnection | null
  assessmentResult: AssessmentRunResult | null
  initialQuery?: string
}

export function JobMarketplace({ profile, connection, assessmentResult, initialQuery = '' }: JobMarketplaceProps) {
  const [query, setQuery] = useState(initialQuery)
  const [workMode, setWorkMode] = useState('All modes')
  const [engagement, setEngagement] = useState('All types')
  const [visibleCount, setVisibleCount] = useState(12)
  const [savedJobs, setSavedJobs] = useState(loadSavedJobs)
  const [appliedJobs, setAppliedJobs] = useState(() => new Set(loadApplicationReceipts().map((item) => item.jobId)))
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filteredJobs = useMemo(() => filterJobVacancies(jobVacancies, query, workMode, engagement), [engagement, query, workMode])

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(timer)
  }, [])

  const updateQuery = (value: string) => {
    setQuery(value)
    setVisibleCount(12)
  }

  const toggleSaved = (jobId: string) => {
    const nextSaved = new Set(savedJobs)
    if (nextSaved.has(jobId)) nextSaved.delete(jobId)
    else nextSaved.add(jobId)
    localStorage.setItem(savedJobsKey, JSON.stringify([...nextSaved]))
    setSavedJobs(nextSaved)
  }

  const clearFilters = () => {
    setQuery('')
    setWorkMode('All modes')
    setEngagement('All types')
    setVisibleCount(12)
  }

  const openJob = (job: JobVacancy) => {
    setSelectedJob(job)
    setMessage(`I’m interested in the ${job.title} opportunity. My background in ${job.skills.slice(0, 2).join(' and ')} aligns well with this role.`)
    setError(null)
  }

  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedJob || !connection || appliedJobs.has(selectedJob.id)) return
    setSubmitting(true)
    setError(null)
    const skills = assessmentResult?.assessment.skills.map((skill) => skill.name).slice(0, 12) || selectedJob.skills
    try {
      const application = await submitJobApplication({
        job_id: selectedJob.id,
        company_id: selectedJob.companyId,
        company_name: selectedJob.client,
        job_title: selectedJob.title,
        applicant_wallet: connection.address,
        applicant_name: profile.displayName,
        applicant_headline: profile.headline,
        applicant_role: profile.role || 'talent',
        skills,
        message,
      })
      saveApplicationReceipt({ id: application.id, jobId: application.job_id, createdAt: application.created_at })
      setAppliedJobs((current) => new Set(current).add(selectedJob.id))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Your application could not be submitted.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="workspace-heading marketplace-hero-heading">
        <div><p className="overline">VERIFIED OPPORTUNITIES</p><h1>Find work that values proof</h1><p>Search 50 active demo companies and send recruiter-visible application requests.</p></div>
        <span className="marketplace-live-pill"><Sparkles size={14} /> Marketplace live</span>
      </div>

      <section className="jobs-search-panel">
        <label className="jobs-search-field"><Search size={19} /><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search roles, companies, skills, or locations" aria-label="Search job vacancies" />{query && <button type="button" aria-label="Clear search" onClick={() => updateQuery('')}><X size={15} /></button>}</label>
        <label className="jobs-filter"><SlidersHorizontal size={15} /><select value={workMode} onChange={(event) => { setWorkMode(event.target.value); setVisibleCount(12) }} aria-label="Filter by work mode"><option>All modes</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select><ChevronDown size={14} /></label>
        <label className="jobs-filter"><BriefcaseBusiness size={15} /><select value={engagement} onChange={(event) => { setEngagement(event.target.value); setVisibleCount(12) }} aria-label="Filter by engagement type"><option>All types</option><option>Full-time</option><option>Contract</option><option>Freelance</option><option>Internship</option></select><ChevronDown size={14} /></label>
      </section>

      <div className="jobs-results-bar"><span><strong>{filteredJobs.length}</strong> opportunities found</span><span><BadgeCheck size={14} /> Verified company listings are marked</span></div>

      {loading ? (
        <div className="jobs-grid">{Array.from({ length: 8 }, (_, index) => <article className="job-card job-card--loading" key={index}><span /><i /><i /><div /></article>)}</div>
      ) : filteredJobs.length > 0 ? (
        <>
          <div className="jobs-grid">
            {filteredJobs.slice(0, visibleCount).map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-card__top">
                  <span className="job-client-logo">{job.clientInitials}</span>
                  <div><strong>{job.client}</strong>{job.verifiedClient && <span><BadgeCheck size={12} /> Verified company</span>}</div>
                  <button className={savedJobs.has(job.id) ? 'job-save job-save--active' : 'job-save'} type="button" aria-label={savedJobs.has(job.id) ? 'Remove saved job' : 'Save job'} onClick={() => toggleSaved(job.id)}><Bookmark size={17} /></button>
                </div>
                <h2>{job.title}</h2>
                <p>{job.summary}</p>
                <div className="job-meta"><span><MapPin size={13} /> {job.location}</span><span><BriefcaseBusiness size={13} /> {job.engagement}</span><span><Clock3 size={13} /> {job.postedDaysAgo}d ago</span></div>
                <div className="job-skills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                <div className="job-card__footer"><div><span>Compensation</span><strong>{job.compensation}</strong></div>{job.stellarPayments && <span className="stellar-pay-badge"><Wallet size={13} /> Stellar pay</span>}<button type="button" onClick={() => openJob(job)}>{appliedJobs.has(job.id) ? 'Application sent' : 'View and apply'}</button></div>
              </article>
            ))}
          </div>
          {visibleCount < filteredJobs.length && <button className="jobs-load-more" type="button" onClick={() => setVisibleCount((current) => current + 12)}>Show more opportunities <ChevronDown size={16} /></button>}
        </>
      ) : (
        <div className="jobs-empty"><Search size={27} /><h2>No matching opportunities</h2><p>Try a broader skill, company, or location search.</p><button className="button button--workspace" type="button" onClick={clearFilters}><Check size={15} /> Reset filters</button></div>
      )}

      {selectedJob && (
        <div className="modal-backdrop job-detail-backdrop" role="presentation" onMouseDown={() => setSelectedJob(null)}>
          <section className="job-detail-modal job-apply-modal" role="dialog" aria-modal="true" aria-labelledby="job-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close opportunity" onClick={() => setSelectedJob(null)}><X size={18} /></button>
            <div className="job-detail-client"><span>{selectedJob.clientInitials}</span><div><strong>{selectedJob.client}</strong><small>{selectedJob.verifiedClient ? 'Verified marketplace company' : 'Marketplace company'}</small></div></div>
            <p className="overline">APPLICATION REQUEST</p>
            <h2 id="job-detail-title">{selectedJob.title}</h2>
            <p>{selectedJob.summary}</p>
            <dl><div><dt>Location</dt><dd>{selectedJob.location}</dd></div><div><dt>Work mode</dt><dd>{selectedJob.workMode}</dd></div><div><dt>Engagement</dt><dd>{selectedJob.engagement}</dd></div><div><dt>Compensation</dt><dd>{selectedJob.compensation}</dd></div></dl>
            <div className="job-detail-skills"><strong>Skills requested</strong><div>{selectedJob.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
            {appliedJobs.has(selectedJob.id) ? <div className="application-success"><Check size={19} /><div><strong>Application sent</strong><span>The recruiter can now review your request from their SkillChain inbox.</span></div></div> : (
              <form className="job-apply-form" onSubmit={apply}>
                <label><span>Message to recruiter</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={20} maxLength={1200} required /></label>
                {!connection && <div className="credential-error"><CircleAlert size={17} /><div><strong>Wallet required</strong><span>Connect your wallet before submitting an application.</span></div></div>}
                {error && <div className="credential-error"><CircleAlert size={17} /><div><strong>Application failed</strong><span>{error}</span></div></div>}
                <button className="button button--primary button--wide" type="submit" disabled={!connection || submitting || message.trim().length < 20}>{submitting ? <><LoaderCircle className="spin" size={16} /> Sending to recruiter</> : <><Send size={16} /> Apply with SkillChain profile</>}</button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  )
}
