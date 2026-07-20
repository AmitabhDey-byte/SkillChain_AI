import { BriefcaseBusiness, Building2, LoaderCircle, Search, Sparkles, UserRoundSearch, X } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { searchCompanies } from '../data/companies'
import { filterJobVacancies, jobVacancies } from '../data/jobs'
import { mergeTalentProfiles, searchTalent, talentProfiles } from '../data/talent'
import { getTalentDirectory, type UserProfile } from '../lib/api'

type UniversalSearchProps = {
  audience: 'talent' | 'recruiter'
  onOpenJobs: (query: string) => void
  onOpenTalent?: (query: string) => void
}

export function UniversalSearch({ audience, onOpenJobs, onOpenTalent }: UniversalSearchProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [members, setMembers] = useState<UserProfile[]>([])
  const deferredQuery = useDeferredValue(query)
  const searching = query !== deferredQuery
  const searchableTalent = useMemo(() => audience === 'recruiter' ? mergeTalentProfiles(members) : talentProfiles, [audience, members])

  useEffect(() => {
    if (audience !== 'recruiter') return
    const controller = new AbortController()
    getTalentDirectory(controller.signal)
      .then((directory) => setMembers(directory.profiles))
      .catch(() => undefined)
    return () => controller.abort()
  }, [audience])

  const results = useMemo(() => {
    if (!deferredQuery.trim()) return { jobs: [], companies: [], talent: [] }
    return {
      jobs: filterJobVacancies(jobVacancies, deferredQuery, 'All modes', 'All types').slice(0, 4),
      companies: searchCompanies(deferredQuery).slice(0, 4),
      talent: searchTalent(deferredQuery, 'All skills', searchableTalent).slice(0, 5),
    }
  }, [deferredQuery, searchableTalent])
  const hasResults = results.jobs.length + results.companies.length + results.talent.length > 0

  const chooseJobs = (value: string) => {
    onOpenJobs(value)
    setFocused(false)
  }

  const chooseTalent = (value: string) => {
    onOpenTalent?.(value)
    setFocused(false)
  }

  return (
    <div className="universal-search">
      <Search size={17} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} placeholder={audience === 'recruiter' ? 'Search talent, skills, companies…' : 'Search jobs, companies, skills…'} aria-label="Search SkillChain marketplace" />
      {searching && <LoaderCircle className="spin" size={15} />}
      {query && !searching && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}
      {focused && query.trim() && (
        <>
          <button className="universal-search-scrim" type="button" aria-label="Close search results" onClick={() => setFocused(false)} />
          <div className="universal-results">
            <div className="universal-results__head"><span><Sparkles size={13} /> SkillChain discovery</span><small>{audience === 'recruiter' ? 'Talent-first results' : 'Opportunity-first results'}</small></div>
            {audience === 'recruiter' && results.talent.length > 0 && <section><p>TALENT NETWORK</p>{results.talent.map((talent) => <button type="button" key={talent.id} onClick={() => chooseTalent(talent.name)}><span className="search-result-icon search-result-icon--talent"><UserRoundSearch size={15} /></span><div><strong>{talent.name}</strong><small>{talent.headline}</small></div><b>{talent.score ?? 'LIVE'}</b></button>)}</section>}
            {audience === 'talent' && results.jobs.length > 0 && <section><p>OPPORTUNITIES</p>{results.jobs.map((job) => <button type="button" key={job.id} onClick={() => chooseJobs(job.title)}><span className="search-result-icon"><BriefcaseBusiness size={15} /></span><div><strong>{job.title}</strong><small>{job.client} · {job.location}</small></div></button>)}</section>}
            {results.companies.length > 0 && <section><p>COMPANIES</p>{results.companies.map((company) => <button type="button" key={company.id} onClick={() => audience === 'recruiter' ? chooseTalent(company.sector) : chooseJobs(company.name)}><span className="search-result-icon search-result-icon--company"><Building2 size={15} /></span><div><strong>{company.name}</strong><small>{company.sector} · {company.location}</small></div></button>)}</section>}
            {!searching && !hasResults && <div className="universal-results-empty"><Search size={20} /> No matching jobs, companies, or talent.</div>}
          </div>
        </>
      )}
    </div>
  )
}
