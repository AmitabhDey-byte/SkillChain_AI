import { BadgeCheck, Bookmark, BriefcaseBusiness, Check, ChevronDown, Clock3, MapPin, Search, SlidersHorizontal, Sparkles, Wallet, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { filterJobVacancies, jobVacancies, type JobVacancy } from '../data/jobs'

const SAVED_JOBS_KEY = 'skillchain.jobs.saved'

function loadSavedJobs() {
  const saved = localStorage.getItem(SAVED_JOBS_KEY)
  if (!saved) return new Set<string>()

  try {
    return new Set<string>(JSON.parse(saved))
  } catch {
    return new Set<string>()
  }
}

export function JobMarketplace() {
  const [query, setQuery] = useState('')
  const [workMode, setWorkMode] = useState('All modes')
  const [engagement, setEngagement] = useState('All types')
  const [visibleCount, setVisibleCount] = useState(12)
  const [savedJobs, setSavedJobs] = useState(loadSavedJobs)
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null)
  const [interestSent, setInterestSent] = useState(false)

  const filteredJobs = useMemo(() => {
    return filterJobVacancies(jobVacancies, query, workMode, engagement)
  }, [engagement, query, workMode])

  const updateQuery = (value: string) => {
    setQuery(value)
    setVisibleCount(12)
  }

  const toggleSaved = (jobId: string) => {
    const nextSaved = new Set(savedJobs)
    if (nextSaved.has(jobId)) nextSaved.delete(jobId)
    else nextSaved.add(jobId)
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify([...nextSaved]))
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
    setInterestSent(false)
  }

  const expressInterest = () => {
    if (!selectedJob) return
    const nextSaved = new Set(savedJobs).add(selectedJob.id)
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify([...nextSaved]))
    setSavedJobs(nextSaved)
    setInterestSent(true)
  }

  return (
    <>
      <div className="workspace-heading jobs-heading">
        <div><p className="overline">DEMO OPPORTUNITIES</p><h1>Find your next project</h1><p>Explore 50 sample vacancies from clients looking for verified technical talent.</p></div>
        <span className="jobs-demo-badge"><Sparkles size={14} /> Demo listings</span>
      </div>

      <section className="jobs-search-panel">
        <label className="jobs-search-field"><Search size={19} /><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search roles, clients, skills, or locations" aria-label="Search job vacancies" />{query && <button type="button" aria-label="Clear search" onClick={() => updateQuery('')}><X size={15} /></button>}</label>
        <label className="jobs-filter"><SlidersHorizontal size={15} /><select value={workMode} onChange={(event) => { setWorkMode(event.target.value); setVisibleCount(12) }} aria-label="Filter by work mode"><option>All modes</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select><ChevronDown size={14} /></label>
        <label className="jobs-filter"><BriefcaseBusiness size={15} /><select value={engagement} onChange={(event) => { setEngagement(event.target.value); setVisibleCount(12) }} aria-label="Filter by engagement type"><option>All types</option><option>Full-time</option><option>Contract</option><option>Freelance</option><option>Internship</option></select><ChevronDown size={14} /></label>
      </section>

      <div className="jobs-results-bar"><span><strong>{filteredJobs.length}</strong> opportunities found</span><span><BadgeCheck size={14} /> Verified client listings are marked</span></div>

      {filteredJobs.length > 0 ? (
        <>
          <div className="jobs-grid">
            {filteredJobs.slice(0, visibleCount).map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-card__top">
                  <span className="job-client-logo">{job.clientInitials}</span>
                  <div><strong>{job.client}</strong>{job.verifiedClient && <span><BadgeCheck size={12} /> Verified client</span>}</div>
                  <button className={savedJobs.has(job.id) ? 'job-save job-save--active' : 'job-save'} type="button" aria-label={savedJobs.has(job.id) ? 'Remove saved job' : 'Save job'} onClick={() => toggleSaved(job.id)}><Bookmark size={17} /></button>
                </div>
                <h2>{job.title}</h2>
                <p>{job.summary}</p>
                <div className="job-meta"><span><MapPin size={13} /> {job.location}</span><span><BriefcaseBusiness size={13} /> {job.engagement}</span><span><Clock3 size={13} /> {job.postedDaysAgo}d ago</span></div>
                <div className="job-skills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                <div className="job-card__footer"><div><span>Compensation</span><strong>{job.compensation}</strong></div>{job.stellarPayments && <span className="stellar-pay-badge"><Wallet size={13} /> Stellar pay</span>}<button type="button" onClick={() => openJob(job)}>View opportunity</button></div>
              </article>
            ))}
          </div>
          {visibleCount < filteredJobs.length && <button className="jobs-load-more" type="button" onClick={() => setVisibleCount((current) => current + 12)}>Show more opportunities <ChevronDown size={16} /></button>}
        </>
      ) : (
        <div className="jobs-empty"><Search size={27} /><h2>No matching opportunities</h2><p>Try a broader skill, client, or location search.</p><button className="button button--workspace" type="button" onClick={clearFilters}><Check size={15} /> Reset filters</button></div>
      )}

      {selectedJob && (
        <div className="modal-backdrop job-detail-backdrop" role="presentation" onMouseDown={() => setSelectedJob(null)}>
          <section className="job-detail-modal" role="dialog" aria-modal="true" aria-labelledby="job-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close opportunity" onClick={() => setSelectedJob(null)}><X size={18} /></button>
            <div className="job-detail-client"><span>{selectedJob.clientInitials}</span><div><strong>{selectedJob.client}</strong><small>{selectedJob.verifiedClient ? 'Verified demo client' : 'Demo client'}</small></div></div>
            <p className="overline">SAMPLE OPPORTUNITY</p>
            <h2 id="job-detail-title">{selectedJob.title}</h2>
            <p>{selectedJob.summary}</p>
            <dl><div><dt>Location</dt><dd>{selectedJob.location}</dd></div><div><dt>Work mode</dt><dd>{selectedJob.workMode}</dd></div><div><dt>Engagement</dt><dd>{selectedJob.engagement}</dd></div><div><dt>Compensation</dt><dd>{selectedJob.compensation}</dd></div></dl>
            <div className="job-detail-skills"><strong>Skills requested</strong><div>{selectedJob.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
            <div className="job-detail-note"><Sparkles size={16} /><span>This is demonstration content for the SkillChain MVP. No real application is submitted.</span></div>
            <button className="button button--primary button--wide" type="button" onClick={expressInterest}>{interestSent ? <><Check size={16} /> Saved to your opportunities</> : <><Bookmark size={16} /> Save and express demo interest</>}</button>
          </section>
        </div>
      )}
    </>
  )
}
