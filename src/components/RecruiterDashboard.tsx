import {
  BadgeCheck,
  Blocks,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Home,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { CredentialVerificationResponse } from '../lib/api'
import { buildVerificationUrl } from '../lib/credentialSharing'
import type { OnboardingProfile } from '../lib/onboarding'
import { clearRecruiterHistory, loadRecruiterHistory, recordRecruiterVerification } from '../lib/recruiterHistory'
import { isTestnet, shortenAddress, type WalletConnection } from '../lib/wallet'
import { CredentialVerifier } from './CredentialVerifier'

type RecruiterDashboardProps = {
  profile: OnboardingProfile
  connection: WalletConnection | null
  onOpenWallet: () => void
  onDisconnect: () => void
}

type RecruiterSection = 'Overview' | 'Verify candidates' | 'Review history'

const recruiterNav = [
  { label: 'Overview', icon: Home },
  { label: 'Verify candidates', icon: Search },
  { label: 'Review history', icon: UsersRound },
] satisfies Array<{ label: RecruiterSection; icon: typeof Home }>

export function RecruiterDashboard({ profile, connection, onOpenWallet, onDisconnect }: RecruiterDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<RecruiterSection>('Overview')
  const [history, setHistory] = useState(loadRecruiterHistory)
  const firstName = profile.displayName.trim().split(' ')[0] || 'Recruiter'

  const recordVerification = (result: CredentialVerificationResponse) => {
    setHistory(recordRecruiterVerification(result))
  }

  const clearHistory = () => {
    clearRecruiterHistory()
    setHistory([])
  }

  const selectSection = (section: RecruiterSection) => {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  const historyList = history.length > 0 ? (
    <div className="recruiter-history-list recruiter-dashboard-history">
      {history.map((item) => (
        <article key={item.credential_id}>
          <span className="recruiter-history-status"><BadgeCheck size={18} /></span>
          <div><strong>{shortenAddress(item.owner)}</strong><span>{item.credential_id}</span></div>
          <div><strong><Check size={12} /> Active</strong><span>{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.verified_at))}</span></div>
          <a href={buildVerificationUrl(item.credential_id, item.owner)} target="_blank" rel="noreferrer" aria-label="Open verification"><ExternalLink size={15} /></a>
        </article>
      ))}
    </div>
  ) : (
    <div className="recruiter-history-empty"><Search size={24} /><strong>No candidates verified yet</strong><span>Your successful credential checks will appear here.</span></div>
  )

  return (
    <main className="dashboard-layout recruiter-dashboard">
      <aside className={sidebarOpen ? 'dashboard-sidebar dashboard-sidebar--open' : 'dashboard-sidebar'}>
        <div className="dashboard-brand"><span><Blocks size={19} /></span> SkillChain <strong>Hire</strong></div>
        <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        <nav className="dashboard-nav" aria-label="Recruiter navigation">
          <p>HIRING DESK</p>
          {recruiterNav.map(({ label, icon: Icon }) => <button className={activeSection === label ? 'active' : ''} type="button" key={label} onClick={() => selectSection(label)}><Icon size={17} /><span>{label}</span>{label === 'Review history' && history.length > 0 && <small>{history.length}</small>}</button>)}
        </nav>
        <div className="sidebar-wallet">
          <div><span className={connection && isTestnet(connection.network) ? 'wallet-dot' : 'wallet-dot wallet-dot--warning'} /><small>{connection?.network || 'Wallet offline'}</small></div>
          <strong>{connection ? shortenAddress(connection.address) : 'Not connected'}</strong>
          <button type="button" onClick={onOpenWallet}>Manage identity <ChevronRight size={13} /></button>
        </div>
        <button className="sidebar-signout" type="button" onClick={onDisconnect}><LogOut size={15} /> Disconnect and exit</button>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div><button className="dashboard-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><span className="dashboard-breadcrumb">Hiring desk <ChevronRight size={13} /> {activeSection}</span></div>
          <div className="topbar-actions"><button className="profile-chip" type="button" onClick={() => selectSection('Overview')}><span>{profile.displayName.slice(0, 2).toUpperCase() || 'HR'}</span><div><strong>{profile.displayName || 'Recruiter'}</strong><small>{profile.organization || profile.headline}</small></div></button></div>
        </header>

        <div className="dashboard-content">
          {activeSection === 'Overview' && (
            <>
              <div className="dashboard-welcome"><div><p className="overline">RECRUITER WORKSPACE</p><h1>Welcome, {firstName}.</h1><p>Verify candidate credentials and keep a trusted review trail for {profile.organization || 'your organization'}.</p></div><button className="button button--primary" type="button" onClick={() => selectSection('Verify candidates')}><Search size={17} /> Verify candidate</button></div>
              <div className="metric-grid">
                <article><div className="metric-icon metric-icon--green"><BadgeCheck size={19} /></div><div><span>Verified candidates</span><strong>{history.length}</strong><small><Check size={12} /> Active credentials</small></div></article>
                <article><div className="metric-icon metric-icon--blue"><BriefcaseBusiness size={19} /></div><div><span>Organization</span><strong className="metric-text-value">{profile.organization || 'Private'}</strong><small>Recruiter workspace</small></div></article>
                <article><div className="metric-icon metric-icon--amber"><Clock3 size={19} /></div><div><span>Latest review</span><strong className="metric-text-value">{history.length ? 'Today' : 'None'}</strong><small>Local review history</small></div></article>
                <article><div className="metric-icon metric-icon--violet"><ShieldCheck size={19} /></div><div><span>Verification source</span><strong className="metric-text-value">Stellar</strong><small>On-chain contract</small></div></article>
              </div>
              <div className="recruiter-dashboard-grid">
                <article className="dashboard-card recruiter-quick-verify"><div className="card-heading"><div><p className="overline">QUICK VERIFICATION</p><h2>Check candidate proof</h2></div><ShieldCheck size={20} /></div><CredentialVerifier onVerified={recordVerification} /></article>
                <article className="dashboard-card recruiter-profile-card"><div className="card-heading"><div><p className="overline">HIRING IDENTITY</p><h2>Your recruiter profile</h2></div></div><div><span>{profile.displayName.slice(0, 2).toUpperCase() || 'HR'}</span><strong>{profile.displayName}</strong><small>{profile.headline}</small></div><dl><div><dt>Organization</dt><dd>{profile.organization}</dd></div><div><dt>Location</dt><dd>{profile.location || 'Not specified'}</dd></div><div><dt>Access</dt><dd className="status-value"><span /> Recruiter</dd></div></dl></article>
              </div>
            </>
          )}

          {activeSection === 'Verify candidates' && (
            <><div className="workspace-heading"><div><p className="overline">LIVE STELLAR CHECK</p><h1>Verify candidates</h1><p>Validate credential ownership and status without accessing a candidate’s private accounts.</p></div></div><CredentialVerifier onVerified={recordVerification} /><div className="verification-guide"><ShieldCheck size={24} /><div><strong>Evidence-backed hiring</strong><p>Every successful check is saved to your recruiter review history in this browser.</p></div></div></>
          )}

          {activeSection === 'Review history' && (
            <><div className="workspace-heading"><div><p className="overline">CANDIDATE REVIEWS</p><h1>Verification history</h1><p>Reopen the latest credentials reviewed by your hiring team.</p></div>{history.length > 0 && <button className="button button--workspace" type="button" onClick={clearHistory}><Trash2 size={15} /> Clear history</button>}</div>{historyList}</>
          )}
        </div>
      </section>
    </main>
  )
}
