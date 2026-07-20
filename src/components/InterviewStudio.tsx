import { BrainCircuit, Check, ClipboardCheck, Plus, Sparkles, Target, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

const defaultSkills = ['System design', 'Code quality', 'Collaboration']

const questionPatterns = [
  (role: string, skill: string) => `Walk me through a ${role} decision where ${skill.toLowerCase()} changed the outcome.`,
  (_role: string, skill: string) => `Show the strongest artifact that demonstrates ${skill.toLowerCase()}. What trade-offs are visible?`,
  (role: string, skill: string) => `If you rebuilt that work for a larger ${role} context, what would you change first about ${skill.toLowerCase()}?`,
]

export function InterviewStudio() {
  const [role, setRole] = useState('Senior full-stack engineer')
  const [skills, setSkills] = useState(defaultSkills)
  const [skillInput, setSkillInput] = useState('')
  const [generated, setGenerated] = useState(false)

  const questions = useMemo(
    () => skills.flatMap((skill, index) => questionPatterns.slice(0, index === 0 ? 3 : 2).map((pattern) => pattern(role, skill))),
    [role, skills],
  )

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value || skills.includes(value) || skills.length >= 6) return
    setSkills((current) => [...current, value])
    setSkillInput('')
    setGenerated(false)
  }

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">EVIDENCE-BASED INTERVIEWS</p><h1>Interview studio</h1><p>Create a structured interview that asks candidates to explain the proof behind their claims.</p></div></div>
      <section className="interview-studio">
        <article className="interview-builder">
          <div className="card-heading"><div><p className="overline">ROLE BLUEPRINT</p><h2>Design the signal</h2></div><BrainCircuit /></div>
          <label><span>Target role</span><div><Target size={16} /><input value={role} onChange={(event) => { setRole(event.target.value); setGenerated(false) }} /></div></label>
          <label><span>Required evidence areas</span><div><Sparkles size={16} /><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill() } }} placeholder="Add a skill or capability" /><button type="button" onClick={addSkill}><Plus size={15} /></button></div></label>
          <div className="interview-skills">{skills.map((skill) => <span key={skill}>{skill}<button type="button" onClick={() => { setSkills((current) => current.filter((item) => item !== skill)); setGenerated(false) }} aria-label={`Remove ${skill}`}><Trash2 size={11} /></button></span>)}</div>
          <button className="button button--primary" type="button" onClick={() => setGenerated(true)} disabled={!role.trim() || skills.length === 0}><Sparkles size={16} /> Generate interview kit</button>
          <small><Check size={12} /> Generated locally from your role criteria with no additional AI cost.</small>
        </article>
        <article className="interview-kit">
          {!generated ? (
            <div className="interview-kit__empty"><ClipboardCheck size={32} /><strong>Your interview kit will appear here</strong><span>Add the proof areas that matter for this role.</span></div>
          ) : (
            <>
              <div className="interview-kit__head"><span><ClipboardCheck /></span><div><p>STRUCTURED KIT</p><h2>{role}</h2><small>{questions.length} evidence questions · 45 minute format</small></div></div>
              <ol>{questions.map((question, index) => <li key={question}><b>{String(index + 1).padStart(2, '0')}</b><span>{question}</span></li>)}</ol>
              <div className="interview-scorecard"><strong>Scorecard</strong>{['Evidence specificity', 'Technical judgment', 'Ownership', 'Communication'].map((item) => <span key={item}><i /> {item}</span>)}</div>
            </>
          )}
        </article>
      </section>
    </>
  )
}
