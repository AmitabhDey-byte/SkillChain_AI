import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Code2,
  GitBranch,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import {
  completeOnboarding,
  loadOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingProfile,
  type UserRole,
} from '../lib/onboarding'

type OnboardingFlowProps = {
  open: boolean
  onClose: () => void
  onComplete: (profile: OnboardingProfile) => void
}

const roleOptions: Array<{
  value: UserRole
  icon: typeof Code2
  title: string
  description: string
}> = [
  {
    value: 'talent',
    icon: Code2,
    title: 'Student or developer',
    description: 'Verify projects and build a trusted skill passport.',
  },
  {
    value: 'freelancer',
    icon: BriefcaseBusiness,
    title: 'Freelancer',
    description: 'Prove expertise and unlock milestone-based work.',
  },
  {
    value: 'recruiter',
    icon: Building2,
    title: 'Recruiter or client',
    description: 'Verify talent and manage trusted engagements.',
  },
]

const stepLabels = ['Your path', 'Your profile', 'Connect GitHub']

function cleanGithubUsername(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .split('/')[0]
}

export function OnboardingFlow({ open, onClose, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<OnboardingProfile>(loadOnboardingDraft)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const updateProfile = (updates: Partial<OnboardingProfile>) => {
    const nextProfile = { ...profile, ...updates }
    setProfile(nextProfile)
    saveOnboardingDraft(nextProfile)
    setError(null)
  }

  const goNext = () => {
    if (step === 0 && !profile.role) {
      setError('Choose the path that best describes how you will use SkillChain.')
      return
    }

    if (step === 1 && (!profile.displayName.trim() || !profile.headline.trim())) {
      setError('Add your name and a short professional headline to continue.')
      return
    }

    setError(null)
    setStep((current) => Math.min(current + 1, stepLabels.length - 1))
  }

  const finishOnboarding = async (event: FormEvent) => {
    event.preventDefault()
    const githubUsername = cleanGithubUsername(profile.githubUsername)

    if (!githubUsername) {
      setError('Enter your GitHub username or profile URL.')
      return
    }

    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(githubUsername)) {
      setError('Enter a valid GitHub username.')
      return
    }

    if (!profile.githubConsent) {
      setError('Confirm permission to analyze your public GitHub activity.')
      return
    }

    setSubmitting(true)
    setError(null)
    const completedProfile = { ...profile, githubUsername }
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    completeOnboarding(completedProfile)
    setProfile(completedProfile)
    setSubmitting(false)
    onComplete(completedProfile)
  }

  return (
    <div className="modal-backdrop onboarding-backdrop" role="presentation">
      <section className="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <aside className="onboarding-sidebar">
          <div className="onboarding-sidebar__brand"><Sparkles size={18} /> SKILLCHAIN AI</div>
          <div>
            <p className="overline">SET UP YOUR PASSPORT</p>
            <h2>Build trust from the work you already do.</h2>
          </div>
          <ol className="onboarding-steps">
            {stepLabels.map((label, index) => (
              <li className={index === step ? 'active' : index < step ? 'complete' : ''} key={label}>
                <span>{index < step ? <Check size={14} /> : index + 1}</span>
                <div><strong>{label}</strong><small>{index < step ? 'Completed' : index === step ? 'In progress' : 'Up next'}</small></div>
              </li>
            ))}
          </ol>
          <div className="onboarding-security"><ShieldCheck size={16} /> Your profile stays under your control.</div>
        </aside>

        <form className="onboarding-content" onSubmit={finishOnboarding}>
          <button className="modal-close" type="button" aria-label="Close onboarding" onClick={onClose}><X size={19} /></button>
          <div className="mobile-step-progress"><span>Step {step + 1} of {stepLabels.length}</span><div><span style={{ width: `${((step + 1) / stepLabels.length) * 100}%` }} /></div></div>

          {step === 0 && (
            <div className="onboarding-panel">
              <p className="overline onboarding-kicker">START WITH YOUR GOAL</p>
              <h2 id="onboarding-title">How will you use SkillChain?</h2>
              <p className="onboarding-lead">We will tailor your verification experience and dashboard around this choice.</p>
              <div className="role-options">
                {roleOptions.map(({ value, icon: Icon, title, description }) => (
                  <button className={profile.role === value ? 'role-option role-option--selected' : 'role-option'} type="button" key={value} onClick={() => updateProfile({ role: value })}>
                    <span className="role-option__icon"><Icon size={21} /></span>
                    <span><strong>{title}</strong><small>{description}</small></span>
                    <span className="radio-indicator">{profile.role === value && <Check size={13} />}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-panel">
              <p className="overline onboarding-kicker">MAKE IT YOURS</p>
              <h2 id="onboarding-title">Create your public profile.</h2>
              <p className="onboarding-lead">These details appear beside your verified skills and credentials.</p>
              <div className="form-grid">
                <label className="field field--full"><span>Display name</span><div><UserRound size={17} /><input value={profile.displayName} onChange={(event) => updateProfile({ displayName: event.target.value })} placeholder="e.g. Aisha Kapoor" autoFocus /></div></label>
                <label className="field field--full"><span>Professional headline</span><div><Code2 size={17} /><input value={profile.headline} onChange={(event) => updateProfile({ headline: event.target.value })} placeholder="e.g. Full-stack developer building on Stellar" /></div></label>
                <label className="field field--full"><span>Location <small>Optional</small></span><div><MapPin size={17} /><input value={profile.location} onChange={(event) => updateProfile({ location: event.target.value })} placeholder="e.g. Bengaluru, India" /></div></label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-panel">
              <p className="overline onboarding-kicker">PROOF FROM REAL WORK</p>
              <h2 id="onboarding-title">Connect your GitHub identity.</h2>
              <p className="onboarding-lead">We analyze public repository evidence to create an explainable skill assessment.</p>
              <label className="field field--full github-field"><span>GitHub username or URL</span><div><GitBranch size={18} /><input value={profile.githubUsername} onChange={(event) => updateProfile({ githubUsername: event.target.value })} placeholder="github.com/your-username" autoFocus /></div></label>
              <div className="analysis-preview"><strong>What SkillChain analyzes</strong><div className="analysis-tags"><span>Code quality</span><span>Project complexity</span><span>Documentation</span><span>Contribution history</span><span>Tech stack</span></div></div>
              <label className="consent-row"><input type="checkbox" checked={profile.githubConsent} onChange={(event) => updateProfile({ githubConsent: event.target.checked })} /><span>I allow SkillChain to read and analyze my public GitHub profile and repositories. No private repository access is requested.</span></label>
            </div>
          )}

          <div className="onboarding-footer">
            <div>{error && <span className="form-error">{error}</span>}</div>
            <div className="onboarding-footer__actions">
              {step > 0 && <button className="back-button" type="button" onClick={() => { setError(null); setStep((current) => current - 1) }}><ArrowLeft size={16} /> Back</button>}
              {step < stepLabels.length - 1 ? <button className="button button--primary" type="button" onClick={goNext}>Continue <ArrowRight size={17} /></button> : <button className="button button--primary" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={17} /> Creating profile</> : <>Create my profile <ArrowRight size={17} /></>}</button>}
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
