import { BrainCircuit, Check, CircleAlert, ClipboardCheck, Gauge, LoaderCircle, Plus, RotateCcw, Save, Sparkles, Target, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { generateInterviewKit, type InterviewKit, type InterviewSeniority } from '../lib/api'

const defaultSkills = ['System design', 'Code quality', 'Collaboration']
const savedKitKey = 'skillchain.interview-kit'

export function InterviewStudio() {
  const [role, setRole] = useState('Senior full-stack engineer')
  const [seniority, setSeniority] = useState<InterviewSeniority>('senior')
  const [jobDescription, setJobDescription] = useState('Build secure, scalable product experiences across React, FastAPI, and Stellar integrations.')
  const [skills, setSkills] = useState(defaultSkills)
  const [skillInput, setSkillInput] = useState('')
  const [kit, setKit] = useState<InterviewKit | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value || skills.some((skill) => skill.toLowerCase() === value.toLowerCase()) || skills.length >= 6) return
    setSkills((current) => [...current, value])
    setSkillInput('')
    setKit(null)
    setSaved(false)
  }

  const generate = async () => {
    if (!role.trim() || skills.length === 0 || loading) return
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      setKit(await generateInterviewKit(role.trim(), seniority, jobDescription.trim(), skills))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'The interview kit could not be generated.')
    } finally {
      setLoading(false)
    }
  }

  const saveKit = () => {
    if (!kit) return
    localStorage.setItem(savedKitKey, JSON.stringify({ role, seniority, jobDescription, skills, kit }))
    setSaved(true)
  }

  return (
    <>
      <div className="workspace-heading interview-heading"><div><p className="overline">GEMINI HIRING INTELLIGENCE</p><h1>Interview studio</h1><p>Transform role requirements into a fair, evidence-led interview and an actionable evaluation scorecard.</p></div><span className="interview-model-pill"><Sparkles size={14} /> Gemini powered</span></div>
      <section className="interview-studio">
        <article className="interview-builder">
          <div className="card-heading"><div><p className="overline">ROLE BLUEPRINT</p><h2>Design the signal</h2></div><BrainCircuit /></div>
          <div className="interview-field-grid">
            <label><span>Target role</span><div><Target size={17} /><input value={role} maxLength={180} onChange={(event) => { setRole(event.target.value); setKit(null); setSaved(false) }} /></div></label>
            <label><span>Seniority</span><div><Gauge size={17} /><select value={seniority} onChange={(event) => { setSeniority(event.target.value as InterviewSeniority); setKit(null); setSaved(false) }}><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="staff">Staff / Lead</option></select></div></label>
          </div>
          <label className="interview-description"><span>Job context</span><textarea value={jobDescription} maxLength={4000} onChange={(event) => { setJobDescription(event.target.value); setKit(null); setSaved(false) }} placeholder="Add responsibilities, product context, and expected outcomes." /></label>
          <label><span>Evidence domains</span><div><Sparkles size={17} /><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill() } }} placeholder="Add a skill or capability" /><button type="button" onClick={addSkill} aria-label="Add evidence domain"><Plus size={16} /></button></div></label>
          <div className="interview-skills">{skills.map((skill) => <span key={skill}>{skill}<button type="button" onClick={() => { setSkills((current) => current.filter((item) => item !== skill)); setKit(null); setSaved(false) }} aria-label={`Remove ${skill}`}><Trash2 size={12} /></button></span>)}</div>
          {error && <div className="interview-error"><CircleAlert size={17} /><span>{error}</span></div>}
          <button className="button button--primary interview-generate" type="button" onClick={() => void generate()} disabled={!role.trim() || skills.length === 0 || loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />} {loading ? 'Gemini is building your kit' : kit ? 'Regenerate interview kit' : 'Generate interview kit'}</button>
          <small><Check size={13} /> Uses your configured Gemini model through the protected SkillChain API.</small>
        </article>
        <article className={kit ? 'interview-kit interview-kit--ready' : 'interview-kit'}>
          {loading ? (
            <div className="interview-kit__loading"><span><Sparkles /></span><strong>Reading the role signal</strong><p>Gemini is mapping evidence domains, questions, and evaluation criteria.</p><div><i /><i /><i /></div></div>
          ) : !kit ? (
            <div className="interview-kit__empty"><ClipboardCheck size={36} /><strong>Your interview kit will appear here</strong><span>Add the proof areas that matter for this role, then generate a structured plan.</span></div>
          ) : (
            <>
              <div className="interview-kit__head"><span><ClipboardCheck /></span><div><p>AI INTERVIEW KIT</p><h2>{kit.title}</h2><small>{kit.questions.length} evidence questions · {kit.duration_minutes} minute format · {kit.model}</small></div></div>
              <p className="interview-kit__overview">{kit.overview}</p>
              <ol>{kit.questions.map((question, index) => <li key={`${question.skill}-${index}`}><b>{String(index + 1).padStart(2, '0')}</b><span><em>{question.skill}</em><strong>{question.question}</strong><small><Sparkles size={12} /> Look for: {question.look_for}</small></span></li>)}</ol>
              <div className="interview-scorecard"><strong>Evaluation scorecard</strong>{kit.scorecard.map((item) => <span key={item.criterion}><i /><span><b>{item.criterion}</b><small>{item.guidance}</small></span></span>)}</div>
              <div className="interview-kit__actions"><button type="button" onClick={saveKit}><Save size={15} /> {saved ? 'Saved to workspace' : 'Save kit'}</button><button type="button" onClick={() => void generate()}><RotateCcw size={15} /> Regenerate</button></div>
            </>
          )}
        </article>
      </section>
    </>
  )
}
