import { Activity, ArrowUpRight, BriefcaseBusiness, ChartNoAxesCombined, CircleAlert, LoaderCircle, Sparkles, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getJobApplications, type JobApplication } from '../lib/api'

export function RecruiterAnalytics() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getJobApplications(undefined, controller.signal)
      .then((result) => setApplications(result.applications))
      .catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : 'Analytics could not be loaded.'))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const pipeline = useMemo(() => {
    const statuses = ['pending', 'reviewing', 'shortlisted', 'declined'] as const
    return statuses.map((status) => ({
      status,
      count: applications.filter((application) => application.status === status).length,
    }))
  }, [applications])

  const conversion = applications.length
    ? Math.round((pipeline.find((item) => item.status === 'shortlisted')!.count / applications.length) * 100)
    : 0

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">HIRING INTELLIGENCE</p><h1>Talent analytics</h1><p>Understand your proof-first hiring funnel and where candidates need attention.</p></div></div>
      {loading ? <div className="analytics-loader"><LoaderCircle className="spin" /><span>Building your hiring signal</span></div> : error ? <div className="credential-error"><CircleAlert size={18} /><div><strong>Analytics unavailable</strong><span>{error}</span></div></div> : (
        <>
          <div className="metric-grid analytics-metrics">
            <article><div className="metric-icon metric-icon--blue"><UsersRound /></div><div><span>Total applicants</span><strong>{applications.length}</strong><small><ArrowUpRight size={12} /> Live pipeline</small></div></article>
            <article><div className="metric-icon metric-icon--violet"><Sparkles /></div><div><span>Shortlist rate</span><strong>{conversion}%</strong><small>Proof-to-interview</small></div></article>
            <article><div className="metric-icon metric-icon--green"><BriefcaseBusiness /></div><div><span>Active roles</span><strong>{new Set(applications.map((item) => item.job_id)).size}</strong><small>With applicants</small></div></article>
            <article><div className="metric-icon metric-icon--amber"><Activity /></div><div><span>Needs review</span><strong>{pipeline[0].count}</strong><small>Pending decisions</small></div></article>
          </div>
          <section className="analytics-grid">
            <article className="dashboard-card pipeline-chart">
              <div className="card-heading"><div><p className="overline">APPLICATION FUNNEL</p><h2>Pipeline health</h2></div><ChartNoAxesCombined /></div>
              <div>{pipeline.map((item) => {
                const width = applications.length ? Math.max(8, (item.count / applications.length) * 100) : 8
                return <span key={item.status}><b>{item.status}</b><i><em style={{ width: `${width}%` }} /></i><strong>{item.count}</strong></span>
              })}</div>
            </article>
            <article className="dashboard-card analytics-insight">
              <p className="overline">NEXT BEST ACTION</p>
              <span><Sparkles /></span>
              <h2>{pipeline[0].count ? `Review ${pipeline[0].count} fresh proof profiles` : 'Your new queue is clear'}</h2>
              <p>{pipeline[0].count ? 'Start with candidates whose verified skills overlap the role’s top three capability requirements.' : 'Use Talent Radar to discover builders with evidence that matches your next role.'}</p>
              <div><Activity size={15} /> Based on your live application pipeline</div>
            </article>
          </section>
        </>
      )}
    </>
  )
}
