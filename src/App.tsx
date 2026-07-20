import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Binary,
  Blocks,
  BrainCircuit,
  Check,
  CircleDot,
  Fingerprint,
  GitBranch,
  Globe2,
  Network,
  Orbit,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AdminDashboard } from './components/AdminDashboard'
import { AlbedoAssistant } from './components/AlbedoAssistant'
import { Dashboard } from './components/Dashboard'
import { ExplorePage } from './components/ExplorePage'
import { OnboardingFlow } from './components/OnboardingFlow'
import { PublicNav } from './components/PublicNav'
import { PublicVerification } from './components/PublicVerification'
import { RecruiterDashboard } from './components/RecruiterDashboard'
import { RecruiterPortal } from './components/RecruiterPortal'
import { TrustCenter } from './components/TrustCenter'
import { WalletModal } from './components/WalletModal'
import { useWallet } from './hooks/useWallet'
import { isAdminWallet } from './lib/adminAccess'
import { ApiError, getUserProfile, upsertUserProfile } from './lib/api'
import {
  completeOnboarding,
  hasCompletedOnboarding,
  loadOnboardingDraft,
  type OnboardingProfile,
} from './lib/onboarding'
import type { WalletConnection } from './lib/wallet'

const proofLayers = [
  {
    icon: GitBranch,
    label: 'EVIDENCE',
    title: 'Connect the work',
    text: 'GitHub repositories, contribution history, documentation, and project artifacts become your source of truth.',
  },
  {
    icon: BrainCircuit,
    label: 'INTELLIGENCE',
    title: 'Decode the signal',
    text: 'Gemini evaluates architecture, quality, consistency, complexity, and impact with evidence-linked reasoning.',
  },
  {
    icon: Fingerprint,
    label: 'IDENTITY',
    title: 'Own the proof',
    text: 'A signed Stellar wallet session binds your assessment and portable Soroban credential to you.',
  },
]

const platformSignals = [
  { value: '50', label: 'demo opportunities' },
  { value: '<5s', label: 'credential lookup' },
  { value: '06', label: 'scoring dimensions' },
  { value: '24/7', label: 'portable proof' },
]

function dashboardPath(profile: OnboardingProfile) {
  return profile.role === 'recruiter' ? '/recruiter-dashboard' : '/dashboard'
}

type LandingPageProps = {
  connection: WalletConnection | null
  onStart: () => void
  onWallet: () => void
  onEnter: () => void
}

function LandingPage({ connection, onStart, onWallet, onEnter }: LandingPageProps) {
  const navigate = useNavigate()

  return (
    <main className="cosmic-home public-shell">
      <div className="cosmic-noise" />
      <PublicNav connection={connection} onWallet={onWallet} onEnter={connection ? onEnter : undefined} />

      <section className="cosmic-hero">
        <div className="cosmic-hero__copy">
          <p className="cosmic-kicker"><CircleDot size={13} /> THE PROOF LAYER FOR TECHNICAL TALENT</p>
          <h1>Work leaves<br /><span>evidence.</span></h1>
          <p className="cosmic-hero__serif">We turn it into proof.</p>
          <p className="cosmic-hero__description">SkillChain AI transforms real technical work into a verified professional identity recruiters can trust and builders can own.</p>
          <div className="cosmic-hero__actions">
            <button className="cosmic-button cosmic-button--flare" type="button" onClick={onStart}>
              {connection ? 'Enter your proof OS' : 'Create your skill passport'} <ArrowUpRight size={18} />
            </button>
            <button className="cosmic-button cosmic-button--ghost" type="button" onClick={() => navigate('/explore')}>
              Explore the network <Orbit size={17} />
            </button>
          </div>
          <div className="cosmic-proof-points">
            <span><Check /> Non-custodial</span>
            <span><Check /> Evidence-linked AI</span>
            <span><Check /> Stellar testnet</span>
          </div>
        </div>

        <div className="skill-core-stage">
          <div className="skill-core-orbit skill-core-orbit--one" />
          <div className="skill-core-orbit skill-core-orbit--two" />
          <article className="proof-float proof-float--score">
            <span>PROOF SCORE</span>
            <strong>92<i>/100</i></strong>
            <small><Sparkles size={12} /> Gemini verified</small>
          </article>
          <article className="proof-float proof-float--chain">
            <span className="proof-pulse" />
            <div><small>SOROBAN ANCHOR</small><strong>LIVE / TESTNET</strong></div>
            <Blocks size={18} />
          </article>
          <article className="proof-float proof-float--skills">
            <small>TOP SIGNALS</small>
            <span><b>01</b> Systems design <i>96</i></span>
            <span><b>02</b> TypeScript <i>93</i></span>
            <span><b>03</b> Open source <i>89</i></span>
          </article>
        </div>
      </section>

      <section className="signal-marquee" aria-label="Platform capabilities">
        <div>
          <span>AI ASSESSMENT <Sparkles /></span>
          <span>WALLET IDENTITY <WalletCards /></span>
          <span>SKILL GRAPH <Network /></span>
          <span>ON-CHAIN PROOF <Blocks /></span>
          <span>PROOF-FIRST HIRING <ScanSearch /></span>
          <span>AI ASSESSMENT <Sparkles /></span>
          <span>WALLET IDENTITY <WalletCards /></span>
        </div>
      </section>

      <section className="proof-os-section">
        <div className="section-orbit-heading">
          <p>SKILLCHAIN / PROOF OS</p>
          <h2>A professional identity<br />that can explain itself.</h2>
          <span>Not another certificate vault. A living, evidence-backed map of what you can actually build.</span>
        </div>
        <div className="proof-bento">
          <article className="proof-bento__ai">
            <div className="bento-icon"><BrainCircuit /></div>
            <p>AI EVIDENCE ENGINE</p>
            <h3>Transparent intelligence,<br />not a mystery score.</h3>
            <div className="dimension-stack">
              {['Architecture', 'Code quality', 'Complexity', 'Consistency'].map((dimension, index) => (
                <span key={dimension}><b>{dimension}</b><i style={{ width: `${94 - index * 5}%` }} /></span>
              ))}
            </div>
          </article>
          <article className="proof-bento__passport">
            <p>PORTABLE PASSPORT</p>
            <div className="passport-orb"><BadgeCheck /><strong>SC</strong><span /></div>
            <h3>Proof that moves<br />at internet speed.</h3>
            <small>WALLET OWNED · PUBLICLY VERIFIABLE</small>
          </article>
          <article className="proof-bento__network">
            <Network />
            <div><p>OPPORTUNITY GRAPH</p><h3>Skills meet demand.</h3><span>Search jobs, companies, builders, and proof from one intelligent command bar.</span></div>
            <button type="button" onClick={() => navigate('/explore')}>Open graph <ArrowRight size={16} /></button>
          </article>
          <article className="proof-bento__security">
            <ShieldCheck />
            <div><p>TRUST BY DESIGN</p><h3>Signed. Scoped. Verifiable.</h3></div>
            <button type="button" onClick={() => navigate('/trust')}>View controls <ArrowRight size={16} /></button>
          </article>
        </div>
      </section>

      <section className="proof-pipeline">
        <div className="section-orbit-heading">
          <p>FROM COMMIT TO CREDENTIAL</p>
          <h2>Three layers.<br />One trusted signal.</h2>
        </div>
        <div className="proof-layer-grid">
          {proofLayers.map(({ icon: Icon, label, title, text }, index) => (
            <article key={label}>
              <div><span>0{index + 1}</span><Icon /></div>
              <p>{label}</p>
              <h3>{title}</h3>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="hiring-constellation">
        <div className="hiring-visual">
          <span className="hiring-node hiring-node--one">RUST</span>
          <span className="hiring-node hiring-node--two">AI</span>
          <span className="hiring-node hiring-node--three">REACT</span>
          <span className="hiring-node hiring-node--four">SOROBAN</span>
          <span className="hiring-node hiring-node--center"><ScanSearch /><b>94%</b><small>MATCH</small></span>
        </div>
        <div>
          <p className="cosmic-kicker">FOR RECRUITERS AND CLIENTS</p>
          <h2>Hire the signal.<br /><em>Skip the theatre.</em></h2>
          <p>Discover evidence-backed talent, verify credentials instantly, manage applications, and build interview plans around demonstrated skills.</p>
          <button className="cosmic-button cosmic-button--light" type="button" onClick={() => navigate('/recruiters')}>
            Explore hiring intelligence <ArrowUpRight size={18} />
          </button>
        </div>
      </section>

      <section className="platform-signal-grid">
        {platformSignals.map((signal) => <div key={signal.label}><strong>{signal.value}</strong><span>{signal.label}</span></div>)}
      </section>

      <footer className="cosmic-footer">
        <div><Binary /><strong>SkillChain AI</strong><span>Built for the proof economy.</span></div>
        <nav><button type="button" onClick={() => navigate('/explore')}>Explore</button><button type="button" onClick={() => navigate('/verify')}>Verify</button><button type="button" onClick={() => navigate('/trust')}>Trust</button></nav>
        <span><Globe2 size={14} /> Stellar testnet · 2026</span>
      </footer>
    </main>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [profileCreated, setProfileCreated] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(hasCompletedOnboarding)
  const [profile, setProfile] = useState(loadOnboardingDraft)
  const wallet = useWallet()

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'SkillChain AI — The Proof OS',
      '/explore': 'Explore Opportunities — SkillChain AI',
      '/trust': 'Trust Center — SkillChain AI',
      '/verify': 'Verify Credential — SkillChain AI',
      '/recruiters': 'Hiring Intelligence — SkillChain AI',
      '/dashboard': 'Talent Proof OS — SkillChain AI',
      '/recruiter-dashboard': 'Recruiter Command Center — SkillChain AI',
      '/admin': 'Platform Operations — SkillChain AI',
    }
    document.title = titles[location.pathname] || titles['/']
  }, [location.pathname])

  useEffect(() => {
    if (!wallet.connection || isAdminWallet(wallet.connection.address)) return
    const controller = new AbortController()
    getUserProfile(controller.signal)
      .then((serverProfile) => {
        const syncedProfile: OnboardingProfile = {
          role: serverProfile.role,
          displayName: serverProfile.display_name,
          headline: serverProfile.headline,
          location: serverProfile.location || '',
          organization: serverProfile.organization || '',
          githubUsername: serverProfile.github_username || '',
          githubConsent: Boolean(serverProfile.github_username),
        }
        completeOnboarding(syncedProfile)
        setProfile(syncedProfile)
        setOnboardingComplete(true)
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) return
      })
    return () => controller.abort()
  }, [wallet.connection])

  const openSavedDashboard = () => {
    if (isAdminWallet(wallet.connection?.address)) {
      navigate('/admin')
      return
    }
    navigate(dashboardPath(profile))
  }

  const openPrimaryFlow = () => {
    if (wallet.status === 'connected') {
      if (onboardingComplete) openSavedDashboard()
      else setOnboardingOpen(true)
      return
    }
    setWalletModalOpen(true)
  }

  const continueFromWallet = () => {
    setWalletModalOpen(false)
    if (isAdminWallet(wallet.connection?.address)) navigate('/admin')
    else if (onboardingComplete) navigate(dashboardPath(profile))
    else setOnboardingOpen(true)
  }

  const handleProfileComplete = async (completedProfile: OnboardingProfile) => {
    if (!completedProfile.role) throw new Error('Choose a SkillChain role to continue.')
    await upsertUserProfile({
      role: completedProfile.role,
      display_name: completedProfile.displayName,
      headline: completedProfile.headline,
      location: completedProfile.location || undefined,
      organization: completedProfile.organization || undefined,
      github_username: completedProfile.githubUsername || undefined,
      avatar_url: completedProfile.githubUsername
        ? `https://github.com/${completedProfile.githubUsername}.png?size=192`
        : undefined,
      skills: [],
    })
    completeOnboarding(completedProfile)
    setProfile(completedProfile)
    setOnboardingComplete(true)
    setOnboardingOpen(false)
    setProfileCreated(true)
    navigate(dashboardPath(completedProfile))
    window.setTimeout(() => setProfileCreated(false), 4500)
  }

  const disconnectAndExit = () => {
    wallet.disconnect()
    navigate('/')
  }

  const sharedPageProps = {
    connection: wallet.connection,
    onWallet: () => setWalletModalOpen(true),
    onEnter: openPrimaryFlow,
  }

  let page
  if (location.pathname === '/verify') page = <PublicVerification />
  else if (location.pathname === '/recruiters') page = <RecruiterPortal />
  else if (location.pathname === '/explore') page = <ExplorePage {...sharedPageProps} />
  else if (location.pathname === '/trust') page = <TrustCenter {...sharedPageProps} />
  else if (location.pathname === '/admin') {
    page = wallet.status === 'checking'
      ? <main className="route-loader"><Zap className="spin" /><span>Validating operator identity</span></main>
      : wallet.connection && isAdminWallet(wallet.connection.address)
        ? <AdminDashboard connection={wallet.connection} onDisconnect={disconnectAndExit} />
        : <Navigate to="/" replace />
  } else if (location.pathname === '/recruiter-dashboard') {
    page = onboardingComplete && profile.role === 'recruiter'
      ? <RecruiterDashboard profile={profile} connection={wallet.connection} onOpenWallet={() => setWalletModalOpen(true)} onDisconnect={disconnectAndExit} />
      : <Navigate to="/" replace />
  } else if (location.pathname === '/dashboard') {
    page = onboardingComplete && profile.role !== 'recruiter'
      ? <Dashboard profile={profile} connection={wallet.connection} onOpenWallet={() => setWalletModalOpen(true)} onDisconnect={disconnectAndExit} />
      : <Navigate to="/" replace />
  } else {
    page = (
      <LandingPage
        connection={wallet.connection}
        onStart={openPrimaryFlow}
        onWallet={() => setWalletModalOpen(true)}
        onEnter={openSavedDashboard}
      />
    )
  }

  return (
    <>
      {page}
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
        <div className="success-toast" role="status">
          <Check size={17} />
          {profile.role === 'recruiter' ? 'Hiring command center activated.' : 'Your proof OS is ready.'}
        </div>
      )}
      <AlbedoAssistant role={onboardingComplete ? profile.role : 'visitor'} />
    </>
  )
}

export default App
