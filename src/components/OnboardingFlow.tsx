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
  loadOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingProfile,
  type UserRole,
} from '../lib/onboarding'

type OnboardingFlowProps = {
  open: boolean
  onClose: () => void
  onComplete: (profile: OnboardingProfile) => Promise<void>
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
  const recruiterFlow = profile.role === 'recruiter'
  const stepLabels = recruiterFlow ? ['Your path', 'Organization', 'Start reviewing'] : ['Your path', 'Your profile', 'Connect GitHub']

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
    if (recruiterFlow) {
      if (!profile.organization.trim()) {
        setError('Add your company or organization name.')
        return
      }

      setSubmitting(true)
      setError(null)
      try {
        await onComplete(profile)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Your workspace could not be created.')
      } finally {
        setSubmitting(false)
      }
      return
    }

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
    try {
      await onComplete(completedProfile)
      setProfile(completedProfile)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Your profile could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop onboarding-backdrop" role="presentation">
      <section className="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <aside className="onboarding-sidebar">
          <div className="onboarding-sidebar__brand"><Sparkles size={18} /> SKILLCHAIN AI</div>
          <div>
            <p className="overline">{recruiterFlow ? 'SET UP YOUR HIRING DESK' : 'SET UP YOUR PASSPORT'}</p>
            <h2>{recruiterFlow ? 'Review technical proof with confidence.' : 'Build trust from the work you already do.'}</h2>
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
              <p className="overline onboarding-kicker">{recruiterFlow ? 'YOUR HIRING IDENTITY' : 'MAKE IT YOURS'}</p>
              <h2 id="onboarding-title">{recruiterFlow ? 'Set up your recruiter profile.' : 'Create your public profile.'}</h2>
              <p className="onboarding-lead">{recruiterFlow ? 'These details personalize your private candidate review workspace.' : 'These details appear beside your verified skills and credentials.'}</p>
              <div className="form-grid">
                <label className="field field--full"><span>Display name</span><div><UserRound size={17} /><input value={profile.displayName} onChange={(event) => updateProfile({ displayName: event.target.value })} placeholder="e.g. Aisha Kapoor" autoFocus /></div></label>
                <label className="field field--full"><span>{recruiterFlow ? 'Role or title' : 'Professional headline'}</span><div>{recruiterFlow ? <BriefcaseBusiness size={17} /> : <Code2 size={17} />}<input value={profile.headline} onChange={(event) => updateProfile({ headline: event.target.value })} placeholder={recruiterFlow ? 'e.g. Technical recruiter' : 'e.g. Full-stack developer building on Stellar'} /></div></label>
                {recruiterFlow && <label className="field field--full"><span>Company or organization</span><div><Building2 size={17} /><input value={profile.organization} onChange={(event) => updateProfile({ organization: event.target.value })} placeholder="e.g. Stellar Labs" /></div></label>}
                <label className="field field--full"><span>Location <small>Optional</small></span><div><MapPin size={17} /><input value={profile.location} onChange={(event) => updateProfile({ location: event.target.value })} placeholder="e.g. Bengaluru, India" /></div></label>
              </div>
            </div>
          )}

          {step === 2 && recruiterFlow && (
            <div className="onboarding-panel recruiter-onboarding-ready">
              <span><ShieldCheck size={31} /></span>
              <p className="overline onboarding-kicker">RECRUITER WORKSPACE READY</p>
              <h2 id="onboarding-title">Start reviewing verified talent.</h2>
              <p className="onboarding-lead">Your dashboard is designed for credential verification, candidate review history, and trusted hiring decisions. GitHub access is not required for recruiter accounts.</p>
              <div className="analysis-preview"><strong>Your recruiter tools</strong><div className="analysis-tags"><span>Live Stellar verification</span><span>Candidate review history</span><span>Downloadable proof</span><span>Shareable verification links</span></div></div>
            </div>
          )}

          {step === 2 && !recruiterFlow && (
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
              {step < stepLabels.length - 1 ? <button className="button button--primary" type="button" onClick={goNext}>Continue <ArrowRight size={17} /></button> : <button className="button button--primary" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={17} /> Creating workspace</> : <>{recruiterFlow ? 'Open recruiter dashboard' : 'Create my profile'} <ArrowRight size={17} /></>}</button>}
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
