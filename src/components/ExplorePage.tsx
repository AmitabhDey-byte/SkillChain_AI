import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Code2,
  MapPin,
  Search,
  Sparkles,
  Star,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { marketplaceCompanies } from '../data/companies'
import { jobVacancies } from '../data/jobs'
import { mergeTalentProfiles } from '../data/talent'
import { ApiError, getTalentDirectory, type UserProfile } from '../lib/api'
import type { WalletConnection } from '../lib/wallet'
import { PublicNav } from './PublicNav'

type ExplorePageProps = {
  connection: WalletConnection | null
  onWallet: () => void
  onEnter: () => void
}

type ExploreTab = 'jobs' | 'companies' | 'talent'

export function ExplorePage({ connection, onWallet, onEnter }: ExplorePageProps) {
  const [tab, setTab] = useState<ExploreTab>('jobs')
  const [query, setQuery] = useState('')
  const [members, setMembers] = useState<UserProfile[]>([])
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const normalized = query.trim().toLowerCase()
  const profiles = useMemo(() => mergeTalentProfiles(members), [members])

  useEffect(() => {
    const controller = new AbortController()
    getTalentDirectory(controller.signal)
      .then((directory) => {
        setMembers(directory.profiles)
        setDirectoryError(null)
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDirectoryError(error instanceof ApiError ? error.message : 'Live member profiles could not be loaded.')
      })
    return () => controller.abort()
  }, [])

  const results = useMemo(() => {
    if (tab === 'jobs') {
      return jobVacancies.filter((job) =>
        [job.title, job.client, job.location, ...job.skills].join(' ').toLowerCase().includes(normalized),
      )
    }
    if (tab === 'companies') {
      return marketplaceCompanies.filter((company) =>
        [company.name, company.sector, company.location].join(' ').toLowerCase().includes(normalized),
      )
    }
    return profiles.filter((talent) =>
      [talent.name, talent.headline, talent.location, ...talent.skills].join(' ').toLowerCase().includes(normalized),
    )
  }, [normalized, profiles, tab])

  return (
    <main className="public-shell explore-page">
      <PublicNav connection={connection} onWallet={onWallet} onEnter={onEnter} />
      <section className="explore-hero">
        <div>
          <p className="cosmic-kicker"><Sparkles size={14} /> LIVE OPPORTUNITY GRAPH</p>
          <h1>Find the signal<br /><em>inside the noise.</em></h1>
          <p>Explore verified talent, forward-thinking teams, and roles designed for proof-first hiring.</p>
        </div>
        <div className="explore-orbit">
          <span><strong>50</strong><small>open roles</small></span>
          <span><strong>50</strong><small>teams</small></span>
          <span><strong>{profiles.length}</strong><small>builders</small></span>
        </div>
      </section>

      <section className="explore-console">
        <div className="explore-tabs" role="tablist">
          <button className={tab === 'jobs' ? 'active' : ''} type="button" onClick={() => setTab('jobs')}><BriefcaseBusiness size={16} /> Jobs</button>
          <button className={tab === 'companies' ? 'active' : ''} type="button" onClick={() => setTab('companies')}><Building2 size={16} /> Companies</button>
          <button className={tab === 'talent' ? 'active' : ''} type="button" onClick={() => setTab('talent')}><UsersRound size={16} /> Talent</button>
        </div>
        <label className="explore-search">
          <Search size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tab}, skills, or locations`} />
          <kbd>/{results.length}</kbd>
        </label>
      </section>

      <section className="explore-results">
        <div className="explore-results__head">
          <span>{results.length} signals found</span>
          <small>{tab === 'talent' ? `${members.length} live member profiles appear before demo talent` : 'Demo marketplace data is clearly marked'}</small>
        </div>

        {tab === 'jobs' && (
          <div className="signal-grid">
            {(results as typeof jobVacancies).slice(0, 24).map((job) => (
              <article className="signal-card signal-card--job" key={job.id}>
                <div className="signal-card__top">
                  <span>{job.clientInitials}</span>
                  <div><strong>{job.client}</strong><small><BadgeCheck size={11} /> Demo verified</small></div>
                  <WalletCards size={17} />
                </div>
                <h2>{job.title}</h2>
                <p>{job.summary}</p>
                <div className="signal-pills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                <dl><div><MapPin size={13} /> {job.location}</div><div><Clock3 size={13} /> {job.engagement}</div></dl>
                <footer><strong>{job.compensation}</strong><button type="button" onClick={onEnter}>Apply with proof <ArrowRight size={14} /></button></footer>
              </article>
            ))}
          </div>
        )}

        {tab === 'companies' && (
          <div className="signal-grid signal-grid--companies">
            {(results as typeof marketplaceCompanies).slice(0, 24).map((company) => (
              <article className="signal-card signal-card--company" key={company.id}>
                <div className="company-glyph" style={{ '--company-color': company.color } as React.CSSProperties}>{company.initials}</div>
                <span className="demo-badge">DEMO COMPANY</span>
                <h2>{company.name}</h2>
                <p>{company.description}</p>
                <div className="company-meta"><span><Code2 size={13} /> {company.sector}</span><span><MapPin size={13} /> {company.location}</span></div>
                <button type="button" onClick={onEnter}>View open roles <ArrowRight size={14} /></button>
              </article>
            ))}
          </div>
        )}

        {tab === 'talent' && (
          <div className="signal-grid">
            {(results as typeof profiles).slice(0, 24).map((talent) => (
              <article className="signal-card signal-card--talent" key={talent.id}>
                <div className="talent-score"><strong>{talent.score ?? 'NEW'}</strong><span>{talent.score === null ? 'MEMBER STATUS' : 'PROOF SCORE'}</span></div>
                <span className="demo-badge">{talent.source === 'member' ? 'LIVE MEMBER' : 'DEMO TALENT'}</span>
                <div className="talent-identity"><span>{talent.initials}</span><div><h2>{talent.name}</h2><small>{talent.role} · {talent.location}</small></div></div>
                <p>{talent.headline}</p>
                <div className="signal-pills">{talent.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                <footer><strong><Star size={13} /> {talent.availability}</strong><button type="button" onClick={onEnter}>Open profile <ArrowRight size={14} /></button></footer>
              </article>
            ))}
          </div>
        )}

        {directoryError && tab === 'talent' && <div className="explore-empty"><UsersRound size={26} /><strong>Live member directory is reconnecting</strong><span>{directoryError}</span></div>}
        {results.length === 0 && <div className="explore-empty"><Search size={26} /><strong>No matching signal</strong><span>Try a broader technology, location, or role.</span></div>}
      </section>
    </main>
  )
}
