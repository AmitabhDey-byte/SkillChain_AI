import { BadgeCheck, BriefcaseBusiness, ChevronDown, ExternalLink, MapPin, RefreshCw, Search, Sparkles, UserRoundSearch } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { mergeTalentProfiles, searchTalent } from '../data/talent'
import { ApiError, getTalentDirectory, type UserProfile } from '../lib/api'
import { Avatar } from './Avatar'

type TalentMarketplaceProps = {
  initialQuery?: string
}

export function TalentMarketplace({ initialQuery = '' }: TalentMarketplaceProps) {
  const [query, setQuery] = useState(initialQuery)
  const [skill, setSkill] = useState('All skills')
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(12)
  const [members, setMembers] = useState<UserProfile[]>([])
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const profiles = useMemo(() => mergeTalentProfiles(members), [members])
  const skills = useMemo(() => ['All skills', ...new Set(profiles.flatMap((profile) => profile.skills))], [profiles])
  const matches = useMemo(() => searchTalent(query, skill, profiles), [profiles, query, skill])

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
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return (
    <>
      <div className="workspace-heading marketplace-hero-heading"><div><p className="overline">AI-MATCHED TALENT</p><h1>Discover proven builders</h1><p>Search registered SkillChain members and demonstration profiles by skill demand.</p></div><span className="marketplace-live-pill"><Sparkles size={14} /> {members.length} live members</span></div>
      <section className="talent-toolbar"><label><Search size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(12) }} placeholder="Search developers, roles, skills, or locations" /></label><label><select value={skill} onChange={(event) => { setSkill(event.target.value); setVisible(12) }}>{skills.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label></section>
      <div className="marketplace-count"><span><strong>{matches.length}</strong> matching professionals</span><span><BadgeCheck size={14} /> Live members appear before demo profiles</span></div>
      {directoryError && <div className="talent-directory-notice"><RefreshCw size={15} /><span>{directoryError} Showing demo profiles until the live directory reconnects.</span></div>}
      {loading ? <div className="talent-grid">{Array.from({ length: 8 }, (_, index) => <div className="talent-card talent-card--loading" key={index}><span /><i /><i /><div /></div>)}</div> : (
        <div className="talent-grid">
          {matches.slice(0, visible).map((talent) => <article className={talent.source === 'member' ? 'talent-card talent-card--member' : 'talent-card'} key={talent.id}><div className="talent-card__top"><Avatar name={talent.name} githubUsername={talent.githubUsername || undefined} src={talent.avatarUrl} size="small" /><div><strong>{talent.name}</strong><small>{talent.role} · {talent.source === 'member' ? 'Live member' : 'Demo profile'}</small></div>{talent.source === 'member' ? <Sparkles size={17} /> : talent.verified && <BadgeCheck size={17} />}</div><h2>{talent.headline}</h2><p><MapPin size={13} /> {talent.location}</p><div className="talent-skill-list">{talent.skills.length > 0 ? talent.skills.map((item) => <span key={item}>{item}</span>) : <span>Assessment pending</span>}</div><div className="talent-score-row"><div><strong>{talent.score ?? 'NEW'}</strong><span>{talent.score === null ? 'Member status' : 'Demo skill score'}</span></div><div><strong>{talent.availability}</strong><span>{talent.rate}</span></div></div>{talent.source === 'member' && talent.githubUsername ? <a className="talent-profile-action" href={`https://github.com/${talent.githubUsername}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open GitHub evidence</a> : <button type="button"><UserRoundSearch size={15} /> View skill passport</button>}</article>)}
        </div>
      )}
      {!loading && visible < matches.length && <button className="jobs-load-more" type="button" onClick={() => setVisible((current) => current + 12)}>Show more talent <ChevronDown size={16} /></button>}
      {!loading && matches.length === 0 && <div className="jobs-empty"><BriefcaseBusiness size={27} /><h2>No skill matches yet</h2><p>Try a broader technology or role.</p></div>}
    </>
  )
}
