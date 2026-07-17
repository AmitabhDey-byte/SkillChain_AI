import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Blocks,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Code2,
  FileCheck2,
  GitBranch,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { RepositorySelector } from './RepositorySelector'
import { AssessmentExperience } from './AssessmentExperience'
import { DashboardSection, type DashboardSectionName } from './DashboardSection'
import { loadAssessmentRepositories, saveAssessmentRepositories } from '../lib/assessmentDraft'
import { clearAssessmentResult, loadAssessmentResult } from '../lib/assessmentResult'
import type { AssessmentRunResult, CredentialIssueResponse, GithubRepository } from '../lib/api'
import { clearCredential, loadCredential, saveCredential } from '../lib/credential'
import type { OnboardingProfile } from '../lib/onboarding'
import { isTestnet, shortenAddress, type WalletConnection } from '../lib/wallet'

type DashboardProps = {
  profile: OnboardingProfile
  connection: WalletConnection | null
  onOpenWallet: () => void
  onDisconnect: () => void
}

const navItems = [
  { label: 'Overview', icon: Home },
  { label: 'Assessments', icon: Sparkles, badge: '1' },
  { label: 'Credentials', icon: BadgeCheck },
  { label: 'Verification', icon: Search },
] satisfies Array<{ label: DashboardSectionName; icon: typeof Home; badge?: string }>

const journeySteps = [
  { label: 'Wallet connected', complete: true },
  { label: 'GitHub profile linked', complete: true },
  { label: 'Repository assessment', complete: false },
  { label: 'Credential issued', complete: false },
]

export function Dashboard({ profile, connection, onOpenWallet, onDisconnect }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<DashboardSectionName>('Overview')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [selectedRepositories, setSelectedRepositories] = useState(loadAssessmentRepositories)
  const [assessmentResult, setAssessmentResult] = useState(loadAssessmentResult)
  const [credential, setCredential] = useState(loadCredential)
  const firstName = profile.displayName.trim().split(' ')[0] || 'Builder'
  const githubUrl = `https://github.com/${profile.githubUsername}`

  const confirmRepositories = (repositories: GithubRepository[]) => {
    saveAssessmentRepositories(repositories)
    clearAssessmentResult()
    setSelectedRepositories(repositories)
    setAssessmentResult(null)
    clearCredential()
    setCredential(null)
    setSelectorOpen(false)
    setAssessmentOpen(true)
  }

  const handleAssessmentComplete = (result: AssessmentRunResult) => {
    setAssessmentResult(result)
  }

  const continueToCredential = () => {
    setAssessmentOpen(false)
    setActiveSection('Credentials')
  }

  const handleCredentialIssued = (issuedCredential: CredentialIssueResponse) => {
    saveCredential(issuedCredential)
    setCredential(issuedCredential)
  }

  const currentJourneySteps = journeySteps.map((item, index) => {
    if (index === 2 && assessmentResult) return { ...item, complete: true }
    if (index === 3 && credential) return { ...item, complete: true }
    return item
  })

  const selectSection = (section: DashboardSectionName) => {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  return (
    <main className="dashboard-layout">
      <aside className={sidebarOpen ? 'dashboard-sidebar dashboard-sidebar--open' : 'dashboard-sidebar'}>
        <div className="dashboard-brand"><span><Blocks size={19} /></span> SkillChain <strong>AI</strong></div>
        <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <p>WORKSPACE</p>
          {navItems.map(({ label, icon: Icon, badge }) => (
            <button className={activeSection === label ? 'active' : ''} type="button" key={label} onClick={() => selectSection(label)}><Icon size={17} /><span>{label}</span>{badge && <small>{assessmentResult ? '1' : badge}</small>}</button>
          ))}
          <p>ACCOUNT</p>
          <button className={activeSection === 'Public profile' ? 'active' : ''} type="button" onClick={() => selectSection('Public profile')}><CircleUserRound size={17} /><span>Public profile</span></button>
          <button className={activeSection === 'Settings' ? 'active' : ''} type="button" onClick={() => selectSection('Settings')}><Settings size={17} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-wallet">
          <div><span className={connection && isTestnet(connection.network) ? 'wallet-dot' : 'wallet-dot wallet-dot--warning'} /><small>{connection?.network || 'Wallet offline'}</small></div>
          <strong>{connection ? shortenAddress(connection.address) : 'Not connected'}</strong>
          <button type="button" onClick={onOpenWallet}>Manage wallet <ChevronRight size={13} /></button>
        </div>
        <button className="sidebar-signout" type="button" onClick={onDisconnect}><LogOut size={15} /> Disconnect and exit</button>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <button className="dashboard-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <span className="dashboard-breadcrumb">Workspace <ChevronRight size={13} /> {activeSection}</span>
          </div>
          <div className="topbar-actions">
            <button type="button" aria-label="Open assessment notifications" onClick={() => selectSection('Assessments')}><Bell size={18} /><span /></button>
            <button className="profile-chip" type="button" onClick={() => selectSection('Public profile')}><span>{profile.displayName.slice(0, 2).toUpperCase() || 'SC'}</span><div><strong>{profile.displayName || 'SkillChain user'}</strong><small>{profile.role || 'Member'}</small></div></button>
          </div>
        </header>

        <div className="dashboard-content">
          {activeSection === 'Overview' ? (
          <>
          <div className="dashboard-welcome">
            <div><p className="overline">YOUR SKILL WORKSPACE</p><h1>Welcome back, {firstName}.</h1><p>Complete your first assessment to turn public work into verified proof.</p></div>
            <button className="button button--primary" type="button" onClick={() => setSelectorOpen(true)}><Plus size={17} /> New assessment</button>
          </div>

          <div className="metric-grid">
            <article><div className="metric-icon metric-icon--green"><ShieldCheck size={19} /></div><div><span>{assessmentResult ? 'AI skill score' : 'Trust readiness'}</span><strong>{assessmentResult ? assessmentResult.assessment.overall_score : '50%'}</strong><small><BarChart3 size={12} /> {assessmentResult ? `${assessmentResult.assessment.level} profile` : '2 of 4 steps complete'}</small></div></article>
            <article><div className="metric-icon metric-icon--blue"><GitBranch size={19} /></div><div><span>Evidence sources</span><strong>1</strong><small><Check size={12} /> GitHub connected</small></div></article>
            <article><div className="metric-icon metric-icon--amber"><Clock3 size={19} /></div><div><span>Active assessments</span><strong>{assessmentResult ? 0 : selectedRepositories.length ? 1 : 0}</strong><small>{assessmentResult ? 'Latest report completed' : selectedRepositories.length ? `${selectedRepositories.length} repositories selected` : 'Ready to start'}</small></div></article>
            <article><div className="metric-icon metric-icon--violet"><BadgeCheck size={19} /></div><div><span>Credentials</span><strong>{credential ? 1 : 0}</strong><small>{credential ? `Active on ${credential.network}` : 'Issued on Stellar'}</small></div></article>
          </div>

          <div className="dashboard-grid">
            <article className="dashboard-card journey-card">
              <div className="card-heading"><div><p className="overline">VERIFICATION JOURNEY</p><h2>Your path to trusted proof</h2></div><span>{credential ? 4 : assessmentResult ? 3 : 2} / 4 complete</span></div>
              <div className="journey-progress"><span style={{ width: credential ? '100%' : assessmentResult ? '75%' : '50%' }} /></div>
              <div className="journey-list">
                {currentJourneySteps.map((item, index) => (
                  <div className={item.complete ? 'complete' : ''} key={item.label}><span>{item.complete ? <Check size={14} /> : index + 1}</span><strong>{item.label}</strong>{!item.complete && index === 2 && <small>Next step</small>}</div>
                ))}
              </div>
              <button className="card-action" type="button" onClick={() => assessmentResult ? setAssessmentOpen(true) : setSelectorOpen(true)}>{assessmentResult ? 'View AI assessment report' : selectedRepositories.length ? 'Edit assessment draft' : 'Continue verification'} <ArrowRight size={16} /></button>
            </article>

            <article className="dashboard-card profile-summary">
              <div className="card-heading"><div><p className="overline">PUBLIC IDENTITY</p><h2>Your profile</h2></div><button type="button" onClick={() => selectSection('Settings')}><Settings size={16} /></button></div>
              <div className="profile-summary__identity"><span>{profile.displayName.slice(0, 2).toUpperCase() || 'SC'}</span><div><strong>{profile.displayName || 'SkillChain user'}</strong><small>{profile.headline || 'Verified professional'}</small></div></div>
              <dl><div><dt>Role</dt><dd>{profile.role || 'Member'}</dd></div><div><dt>Location</dt><dd>{profile.location || 'Not specified'}</dd></div><div><dt>Profile status</dt><dd className="status-value"><span /> Ready</dd></div></dl>
              <button className="card-action card-action--muted" type="button" onClick={() => selectSection('Public profile')}>View public profile <ArrowRight size={16} /></button>
            </article>

            <article className="dashboard-card source-card">
              <div className="card-heading"><div><p className="overline">EVIDENCE SOURCES</p><h2>Connected accounts</h2></div><span className="connected-label"><span /> LIVE</span></div>
              <div className="source-account"><span className="source-logo"><GitBranch size={21} /></span><div><strong>GitHub</strong><small>@{profile.githubUsername || 'not-linked'}</small></div><a href={githubUrl} target="_blank" rel="noreferrer">View <ArrowRight size={14} /></a></div>
              <div className="source-details"><span><Code2 size={15} /> Public repositories</span><span><FileCheck2 size={15} /> Contribution history</span></div>
              <button className="card-action card-action--muted" type="button" onClick={() => setSelectorOpen(true)}>Manage sources <ArrowRight size={16} /></button>
            </article>

            <article className="dashboard-card activity-card">
              <div className="card-heading"><div><p className="overline">RECENT ACTIVITY</p><h2>Account timeline</h2></div></div>
              <div className="activity-list"><div><span><Wallet size={16} /></span><div><strong>Stellar wallet connected</strong><small>Identity ownership established</small></div><time>Today</time></div><div><span><GitBranch size={16} /></span><div><strong>GitHub profile added</strong><small>@{profile.githubUsername || 'not-linked'}</small></div><time>Today</time></div><div><span><PanelLeftClose size={16} /></span><div><strong>Profile created</strong><small>Your SkillChain workspace is live</small></div><time>Today</time></div></div>
            </article>
          </div>
          </>
          ) : (
            <DashboardSection
              section={activeSection}
              profile={profile}
              connection={connection}
              assessmentResult={assessmentResult}
              credential={credential}
              repositories={selectedRepositories}
              onNewAssessment={() => setSelectorOpen(true)}
              onViewAssessment={() => assessmentResult ? setAssessmentOpen(true) : setSelectorOpen(true)}
              onOpenWallet={onOpenWallet}
              onCredentialIssued={handleCredentialIssued}
            />
          )}
        </div>
      </section>
      {selectorOpen && (
        <RepositorySelector
          username={profile.githubUsername}
          initialSelection={selectedRepositories}
          onClose={() => setSelectorOpen(false)}
          onConfirm={confirmRepositories}
        />
      )}
      {assessmentOpen && (
        <AssessmentExperience
          githubUsername={profile.githubUsername}
          repositories={selectedRepositories}
          existingResult={assessmentResult}
          onClose={() => setAssessmentOpen(false)}
          onComplete={handleAssessmentComplete}
          onCredentialStep={continueToCredential}
        />
      )}
    </main>
  )
}
