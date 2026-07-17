import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  Check,
  Code2,
  GitBranch,
  Menu,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { OnboardingFlow } from './components/OnboardingFlow'
import { PublicVerification } from './components/PublicVerification'
import { RecruiterPortal } from './components/RecruiterPortal'
import { WalletModal } from './components/WalletModal'
import { useWallet } from './hooks/useWallet'
import { hasCompletedOnboarding, loadOnboardingDraft, type OnboardingProfile } from './lib/onboarding'
import { isTestnet, shortenAddress } from './lib/wallet'

const steps = [
  {
    icon: GitBranch,
    number: '01',
    title: 'Connect your work',
    description: 'Link GitHub and submit the projects, certificates, and contributions that represent you.',
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'Get AI verified',
    description: 'Our transparent assessment evaluates code quality, consistency, complexity, and impact.',
  },
  {
    icon: BadgeCheck,
    number: '03',
    title: 'Own your proof',
    description: 'Receive a tamper-proof Stellar credential that travels with you throughout your career.',
  },
]

const skills = [
  { name: 'React', score: 92 },
  { name: 'TypeScript', score: 88 },
  { name: 'Smart Contracts', score: 84 },
]

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [profileCreated, setProfileCreated] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(hasCompletedOnboarding)
  const [profile, setProfile] = useState(loadOnboardingDraft)
  const wallet = useWallet()

  const openPrimaryFlow = () => {
    setMenuOpen(false)
    if (wallet.status === 'connected') {
      if (onboardingComplete) navigate('/dashboard')
      else setOnboardingOpen(true)
      return
    }

    setWalletModalOpen(true)
  }

  const continueFromWallet = () => {
    setWalletModalOpen(false)
    if (onboardingComplete) navigate('/dashboard')
    else setOnboardingOpen(true)
  }

  const handleProfileComplete = (completedProfile: OnboardingProfile) => {
    setProfile(completedProfile)
    setOnboardingComplete(true)
    setOnboardingOpen(false)
    setProfileCreated(true)
    navigate('/dashboard')
    window.setTimeout(() => setProfileCreated(false), 4500)
  }

  const disconnectAndExit = () => {
    wallet.disconnect()
    navigate('/')
  }

  return (
    <>
      {location.pathname === '/verify' ? (
        <PublicVerification />
      ) : location.pathname === '/recruiters' ? (
        <RecruiterPortal />
      ) : location.pathname === '/dashboard' ? (
        onboardingComplete ? (
          <Dashboard profile={profile} connection={wallet.connection} onOpenWallet={() => setWalletModalOpen(true)} onDisconnect={disconnectAndExit} />
        ) : (
          <Navigate to="/" replace />
        )
      ) : (
      <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SkillChain AI home">
          <span className="brand-mark"><Blocks size={21} /></span>
          <span>SkillChain <strong>AI</strong></span>
        </a>

        <nav className={menuOpen ? 'nav-links nav-links--open' : 'nav-links'} aria-label="Primary navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#credentials" onClick={() => setMenuOpen(false)}>Credentials</a>
          <a href="#for-recruiters" onClick={() => setMenuOpen(false)}>For recruiters</a>
          <button type="button" onClick={() => navigate('/verify')}>Verify credential</button>
          <button className="button button--small button--outline" type="button" onClick={() => setWalletModalOpen(true)}>
            {wallet.status === 'connected' && wallet.connection ? (
              <><span className={isTestnet(wallet.connection.network) ? 'wallet-dot' : 'wallet-dot wallet-dot--warning'} /> {shortenAddress(wallet.connection.address)}</>
            ) : (
              <><Wallet size={16} /> Connect wallet</>
            )}
          </button>
        </nav>

        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow--one" />
        <div className="hero-glow hero-glow--two" />
        <div className="hero-copy">
          <div className="eyebrow"><span /> Powered by AI. Secured by Stellar.</div>
          <h1>Your skills.<br /><em>Proven on-chain.</em></h1>
          <p className="hero-description">
            Turn your real work into trusted, portable credentials. SkillChain AI verifies what you can do—not just what your résumé says.
          </p>
          <div className="hero-actions">
            <button className="button button--primary" type="button" onClick={openPrimaryFlow}>{onboardingComplete ? 'Open dashboard' : 'Verify my skills'} <ArrowRight size={18} /></button>
            <a className="text-link" href="#how-it-works">See how it works <span>↓</span></a>
          </div>
          <div className="trust-row">
            <span><Check size={15} /> Free to start</span>
            <span><Check size={15} /> You own your data</span>
            <span><Check size={15} /> Stellar testnet</span>
          </div>
        </div>

        <div className="credential-stage" id="credentials" aria-label="Example verified credential">
          <div className="orbit orbit--large" />
          <div className="orbit orbit--small" />
          <div className="floating-chip floating-chip--ai"><Sparkles size={16} /> AI verified</div>
          <div className="floating-chip floating-chip--chain"><ShieldCheck size={16} /> On-chain</div>
          <article className="credential-card">
            <div className="credential-card__top">
              <div className="mini-brand"><Blocks size={16} /> SKILLCHAIN</div>
              <span className="verified-pill"><BadgeCheck size={15} /> VERIFIED</span>
            </div>
            <div className="profile-row">
              <div className="avatar">AM</div>
              <div><p className="overline">SKILL PASSPORT</p><h2>Alex Morgan</h2><p className="muted">Full-stack developer</p></div>
            </div>
            <div className="score-row">
              <div className="score-ring"><strong>89</strong><span>/100</span></div>
              <div><p className="overline">VERIFICATION SCORE</p><strong className="excellent">Excellent</strong><p className="muted">Top 8% of verified talent</p></div>
            </div>
            <div className="skill-list">
              {skills.map((skill) => (
                <div className="skill" key={skill.name}>
                  <div><span>{skill.name}</span><strong>{skill.score}</strong></div>
                  <div className="skill-track"><span style={{ width: `${skill.score}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="credential-footer">
              <span><span className="status-dot" /> Issued on Stellar</span>
              <span className="hash">GDX7...9KQ2</span>
            </div>
          </article>
        </div>
      </section>

      <section className="proof-strip" aria-label="Platform benefits">
        <span><ShieldCheck /> Tamper-proof credentials</span>
        <span><Sparkles /> Evidence-backed AI</span>
        <span><Wallet /> Portable professional identity</span>
        <span><Code2 /> Built for real builders</span>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <p className="overline section-kicker">HOW IT WORKS</p>
          <h2>From code to credential<br />in three clear steps.</h2>
          <p>No opaque tests. No paperwork. Just evidence from the work you have already done.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ icon: Icon, number, title, description }) => (
            <article className="step-card" key={number}>
              <div className="step-card__head"><span className="step-icon"><Icon /></span><span className="step-number">{number}</span></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="recruiter-callout" id="for-recruiters">
        <div>
          <p className="overline section-kicker">FOR HIRING TEAMS</p>
          <h2>Trust the proof,<br />not the pitch.</h2>
        </div>
        <div>
          <p>Verify candidate credentials instantly and spend your interview time on what matters: potential, fit, and impact.</p>
          <button className="button button--light" type="button" onClick={() => navigate('/recruiters')}>Explore recruiter tools <ArrowRight size={18} /></button>
        </div>
      </section>
      </main>
      )}

      <WalletModal
        open={walletModalOpen}
        status={wallet.status}
        connection={wallet.connection}
        error={wallet.error}
        onClose={() => setWalletModalOpen(false)}
        onContinue={continueFromWallet}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
      />
      <OnboardingFlow
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleProfileComplete}
      />
      {profileCreated && (
        <div className="success-toast" role="status"><Check size={17} /> Profile created. Your skill passport is ready to build.</div>
      )}
    </>
  )
}

export default App
