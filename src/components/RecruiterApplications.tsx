import { BadgeCheck, CircleAlert, Clock3, Inbox, LoaderCircle, RefreshCw, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getJobApplications, updateJobApplication, type JobApplication, type JobApplicationStatus } from '../lib/api'
import { shortenAddress } from '../lib/wallet'

const statusOptions: JobApplicationStatus[] = ['pending', 'reviewing', 'shortlisted', 'declined']

export function RecruiterApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadApplications = async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getJobApplications(undefined, signal)
      setApplications(response.applications)
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
      setError(caughtError instanceof Error ? caughtError.message : 'Applications could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => void loadApplications(controller.signal))
    return () => controller.abort()
  }, [])

  const changeStatus = async (application: JobApplication, status: JobApplicationStatus) => {
    setUpdating(application.id)
    setError(null)
    try {
      const updated = await updateJobApplication(application.id, status)
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Application status could not be updated.')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
      <div className="workspace-heading marketplace-hero-heading"><div><p className="overline">APPLICATION INBOX</p><h1>Candidate requests</h1><p>Review applications submitted by developers and freelancers across the SkillChain marketplace.</p></div><button className="button button--workspace" type="button" onClick={() => void loadApplications()} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={15} /> Refresh</button></div>
      {error && <div className="credential-error"><CircleAlert size={18} /><div><strong>Inbox unavailable</strong><span>{error}</span></div></div>}
      {loading ? <div className="application-list">{Array.from({ length: 5 }, (_, index) => <article className="application-card application-card--loading" key={index}><span /><div><i /><i /></div><b /></article>)}</div> : applications.length > 0 ? (
        <div className="application-list">
          {applications.map((application) => <article className="application-card" key={application.id}><span className="application-avatar">{application.applicant_name.slice(0, 2).toUpperCase()}</span><div className="application-main"><div><span className={`application-status application-status--${application.status}`}>{application.status}</span><small><Clock3 size={12} /> {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(application.created_at))}</small></div><h2>{application.applicant_name}</h2><p>{application.applicant_headline}</p><strong>Applied for {application.job_title} at {application.company_name}</strong><div className="application-skills">{application.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><blockquote>{application.message}</blockquote><span className="application-wallet"><Wallet size={13} /> {shortenAddress(application.applicant_wallet)} · Request {application.id.slice(0, 8)}</span></div><label className="application-action"><span>Review status</span><select value={application.status} onChange={(event) => void changeStatus(application, event.target.value as JobApplicationStatus)} disabled={updating === application.id}>{statusOptions.map((status) => <option value={status} key={status}>{status}</option>)}</select>{updating === application.id ? <LoaderCircle className="spin" size={15} /> : application.status === 'shortlisted' ? <BadgeCheck size={15} /> : null}</label></article>)}
        </div>
      ) : <div className="jobs-empty"><Inbox size={29} /><h2>No application requests yet</h2><p>Applications submitted from the talent marketplace will appear here.</p></div>}
    </>
  )
}
