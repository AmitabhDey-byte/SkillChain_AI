import { BadgeCheck, BriefcaseBusiness, ChevronDown, MapPin, Search, Sparkles, UserRoundSearch } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { searchTalent, talentProfiles } from '../data/talent'

type TalentMarketplaceProps = {
  initialQuery?: string
}

export function TalentMarketplace({ initialQuery = '' }: TalentMarketplaceProps) {
  const [query, setQuery] = useState(initialQuery)
  const [skill, setSkill] = useState('All skills')
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(12)
  const skills = useMemo(() => ['All skills', ...new Set(talentProfiles.flatMap((profile) => profile.skills))], [])
  const matches = useMemo(() => searchTalent(query, skill), [query, skill])

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      <div className="workspace-heading marketplace-hero-heading"><div><p className="overline">AI-MATCHED TALENT</p><h1>Discover proven builders</h1><p>Search 50 developer and freelancer profiles by verified skill demand.</p></div><span className="marketplace-live-pill"><Sparkles size={14} /> Skill matching active</span></div>
      <section className="talent-toolbar"><label><Search size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(12) }} placeholder="Search developers, roles, skills, or locations" /></label><label><select value={skill} onChange={(event) => { setSkill(event.target.value); setVisible(12) }}>{skills.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label></section>
      <div className="marketplace-count"><span><strong>{matches.length}</strong> matching professionals</span><span><BadgeCheck size={14} /> AI skill scores are demonstration data</span></div>
      {loading ? <div className="talent-grid">{Array.from({ length: 8 }, (_, index) => <div className="talent-card talent-card--loading" key={index}><span /><i /><i /><div /></div>)}</div> : (
        <div className="talent-grid">
          {matches.slice(0, visible).map((talent) => <article className="talent-card" key={talent.id}><div className="talent-card__top"><span>{talent.initials}</span><div><strong>{talent.name}</strong><small>{talent.role}</small></div>{talent.verified && <BadgeCheck size={17} />}</div><h2>{talent.headline}</h2><p><MapPin size={13} /> {talent.location}</p><div className="talent-skill-list">{talent.skills.map((item) => <span key={item}>{item}</span>)}</div><div className="talent-score-row"><div><strong>{talent.score}</strong><span>Skill score</span></div><div><strong>{talent.availability}</strong><span>{talent.rate}</span></div></div><button type="button"><UserRoundSearch size={15} /> View skill passport</button></article>)}
        </div>
      )}
      {!loading && visible < matches.length && <button className="jobs-load-more" type="button" onClick={() => setVisible((current) => current + 12)}>Show more talent <ChevronDown size={16} /></button>}
      {!loading && matches.length === 0 && <div className="jobs-empty"><BriefcaseBusiness size={27} /><h2>No skill matches yet</h2><p>Try a broader technology or role.</p></div>}
    </>
  )
}
