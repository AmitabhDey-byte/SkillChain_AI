import { Activity, Blocks, Bot, ChevronRight, CircleAlert, Database, ExternalLink, KeyRound, LoaderCircle, LogOut, Menu, RefreshCw, ServerCog, ShieldCheck, Users, Wallet, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ApiError, getAdminFeedback, getAdminOverview, getAdminUsers, getLiveHealth, getReadyHealth, type AdminFeedbackResponse, type AdminOverviewResponse, type AdminUserDirectoryResponse, type LiveHealthResponse, type ReadyHealthResponse } from '../lib/api'
import { shortenAddress, type WalletConnection } from '../lib/wallet'

type AdminDashboardProps = {
  connection: WalletConnection | null
  onDisconnect: () => void
}

function formatActivityType(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AdminDashboard({ connection, onDisconnect }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [live, setLive] = useState<LiveHealthResponse | null>(null)
  const [ready, setReady] = useState<ReadyHealthResponse | null>(null)
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null)
  const [users, setUsers] = useState<AdminUserDirectoryResponse | null>(null)
  const [feedback, setFeedback] = useState<AdminFeedbackResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadDashboard = async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const [liveResult, readyResult, overviewResult, usersResult, feedbackResult] = await Promise.all([
        getLiveHealth(signal),
        getReadyHealth(signal),
        getAdminOverview(signal),
        getAdminUsers(signal),
        getAdminFeedback(signal),
      ])
      setLive(liveResult)
      setReady(readyResult)
      setOverview(overviewResult)
      setUsers(usersResult)
      setFeedback(feedbackResult)
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
      if (caughtError instanceof ApiError && [401, 403].includes(caughtError.status)) {
        setError('This signed wallet is not authorized for platform operations.')
        return
      }
      setError(caughtError instanceof Error ? caughtError.message : 'Admin activity could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => void loadDashboard(controller.signal))
    return () => controller.abort()
  }, [])

  const dependencies = ready?.dependencies
  const explorerBase = ready?.environment === 'production' ? 'https://stellar.expert/explorer/testnet/tx/' : 'https://stellar.expert/explorer/testnet/tx/'

  return (
    <main className="dashboard-layout admin-dashboard">
      <aside className={sidebarOpen ? 'dashboard-sidebar dashboard-sidebar--open' : 'dashboard-sidebar'}>
        <div className="dashboard-brand"><span><Blocks size={19} /></span> SkillChain <strong>Ops</strong></div>
        <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        <nav className="dashboard-nav" aria-label="Admin navigation"><p>OPERATIONS</p><button className="active" type="button"><Activity size={17} /><span>Platform activity</span></button><button type="button" onClick={() => void loadDashboard()}><RefreshCw size={17} /><span>Refresh data</span></button></nav>
        <div className="sidebar-wallet"><div><span className="wallet-dot" /><small>CURRENT WALLET</small></div><strong>{connection ? shortenAddress(connection.address) : 'Not connected'}</strong></div>
        {connection && <button className="sidebar-signout" type="button" onClick={onDisconnect}><LogOut size={15} /> Disconnect wallet</button>}
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <section className="dashboard-main">
        <header className="dashboard-topbar"><div><button className="dashboard-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><span className="dashboard-breadcrumb">Admin <ChevronRight size={13} /> Activity overview</span></div><div className="admin-status-chip"><span /> Authorized operator</div></header>
        <div className="dashboard-content">
          <div className="dashboard-welcome"><div><p className="overline">PLATFORM OPERATIONS</p><h1>Admin control center.</h1><p>Monitor connected wallets, credential events, transaction IDs, and production health.</p></div><button className="button button--primary" type="button" onClick={() => void loadDashboard()} disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />} Refresh data</button></div>
          {error && <div className="credential-error"><CircleAlert size={18} /><div><strong>Admin data unavailable</strong><span>{error}</span></div></div>}
          <div className="metric-grid">
            <article><div className="metric-icon metric-icon--green"><Users size={19} /></div><div><span>Unique wallets</span><strong>{overview?.unique_wallets ?? '—'}</strong><small>Connected users</small></div></article>
            <article><div className="metric-icon metric-icon--blue"><Wallet size={19} /></div><div><span>Wallet logins</span><strong>{overview?.wallet_connections ?? '—'}</strong><small>Connection events</small></div></article>
            <article><div className="metric-icon metric-icon--amber"><ShieldCheck size={19} /></div><div><span>Credentials issued</span><strong>{overview?.credentials_issued ?? '—'}</strong><small>Stellar submissions</small></div></article>
            <article><div className="metric-icon metric-icon--violet"><Activity size={19} /></div><div><span>Verifications</span><strong>{overview?.credentials_verified ?? '—'}</strong><small>Recruiter checks</small></div></article>
          </div>

          <article className="dashboard-card admin-activity-card">
            <div className="card-heading"><div><p className="overline">AUDIT TRAIL</p><h2>Recent platform activity</h2></div><span className="workspace-status workspace-status--complete">{overview?.recent_activity.length ?? 0} events</span></div>
            <div className="admin-table-wrap">
              <table className="admin-activity-table">
                <thead><tr><th>Event</th><th>Wallet</th><th>Proof ID</th><th>Transaction ID</th><th>Time</th></tr></thead>
                <tbody>
                  {overview?.recent_activity.map((item) => (
                    <tr key={item.id}>
                      <td><span className={item.success ? 'admin-event-status admin-event-status--success' : 'admin-event-status'}>{formatActivityType(item.interaction_type)}</span></td>
                      <td><code title={item.wallet_address}>{shortenAddress(item.wallet_address)}</code></td>
                      <td><code title={item.id}>{item.id.slice(0, 8)}…</code></td>
                      <td>{item.transaction_hash ? <a href={`${explorerBase}${item.transaction_hash}`} target="_blank" rel="noreferrer" title={item.transaction_hash}>{item.transaction_hash.slice(0, 10)}…</a> : '—'}</td>
                      <td>{formatTimestamp(item.created_at)}</td>
                    </tr>
                  ))}
                  {!loading && !overview?.recent_activity.length && <tr><td colSpan={5} className="admin-empty-row">No activity has been recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card admin-activity-card">
            <div className="card-heading"><div><p className="overline">USER REGISTRY</p><h2>Joined SkillChain members</h2></div><span className="workspace-status workspace-status--complete">{users?.total ?? 0} profiles</span></div>
            <div className="admin-table-wrap">
              <table className="admin-activity-table">
                <thead><tr><th>Profile</th><th>Role</th><th>GitHub</th><th>Skills</th><th>Joined</th></tr></thead>
                <tbody>
                  {users?.users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.display_name}</strong><br /><small>{user.headline}</small></td>
                      <td><span className="admin-event-status admin-event-status--success">{formatActivityType(user.role)}</span></td>
                      <td>{user.github_username ? `@${user.github_username}` : 'â€”'}</td>
                      <td>{user.skills.length ? user.skills.slice(0, 3).join(', ') : 'â€”'}</td>
                      <td>{formatTimestamp(user.created_at)}</td>
                    </tr>
                  ))}
                  {!loading && !users?.users.length && <tr><td colSpan={5} className="admin-empty-row">No completed user profiles have been recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card admin-activity-card">
            <div className="card-heading"><div><p className="overline">PRODUCT FEEDBACK</p><h2>Member feedback feed</h2></div><span className="workspace-status workspace-status--complete">{feedback?.total ?? 0} responses</span></div>
            <div className="admin-table-wrap">
              <table className="admin-activity-table">
                <thead><tr><th>Rating</th><th>Category</th><th>Page</th><th>Feedback</th><th>Received</th></tr></thead>
                <tbody>
                  {feedback?.feedback.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.rating}/5</strong></td>
                      <td><span className="admin-event-status admin-event-status--success">{formatActivityType(item.category)}</span></td>
                      <td>{item.page || 'â€”'}</td>
                      <td title={item.message}>{item.message}</td>
                      <td>{formatTimestamp(item.created_at)}</td>
                    </tr>
                  ))}
                  {!loading && !feedback?.feedback.length && <tr><td colSpan={5} className="admin-empty-row">No product feedback has been submitted yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <div className="admin-operations-grid">
            <article className="dashboard-card"><div className="card-heading"><div><p className="overline">SERVICE READINESS</p><h2>Production dependencies</h2></div><span className={ready?.status === 'ready' ? 'workspace-status workspace-status--complete' : 'workspace-status'}>{ready?.status || 'Loading'}</span></div><div className="admin-dependency-list"><div><Database size={17} /><span><strong>PostgreSQL</strong><small>Application metadata store</small></span><b>{dependencies?.database || 'checking'}</b></div><div><Bot size={17} /><span><strong>Gemini</strong><small>Portfolio evaluation service</small></span><b>{dependencies?.gemini || 'checking'}</b></div><div><ShieldCheck size={17} /><span><strong>Stellar testnet</strong><small>Soroban credential contract</small></span><b>{dependencies?.stellar || 'checking'}</b></div></div></article>
            <article className="dashboard-card"><div className="card-heading"><div><p className="overline">OPERATOR IDENTITY</p><h2>Runtime identity</h2></div><ServerCog size={19} /></div><dl className="admin-runtime-list"><div><dt>API status</dt><dd>{live?.status || 'Loading'}</dd></div><div><dt>Environment</dt><dd>{ready?.environment || 'Loading'}</dd></div><div><dt>Last heartbeat</dt><dd>{live ? formatTimestamp(live.timestamp) : 'Loading'}</dd></div><div><dt>Endpoint</dt><dd>/api/v1/admin/overview</dd></div></dl><div className="admin-security-note"><KeyRound size={16} /><span>Protected by a signed wallet session and the server-side <code>ADMIN_WALLETS</code> allowlist. No admin secret is stored in the browser.</span></div></article>
            <article className="dashboard-card"><div className="card-heading"><div><p className="overline">ONBOARDING EVIDENCE</p><h2>User interaction spreadsheet</h2></div><Users size={19} /></div><p>Review the submitted wallet-interaction log alongside the live platform registry.</p><a className="card-action card-action--muted" href="https://docs.google.com/spreadsheets/d/1oUoptldG3q2xLOB6MRCxIvKnnaoslLS-xJvDXYy84ZE/edit?usp=sharing" target="_blank" rel="noreferrer">Open interaction spreadsheet <ExternalLink size={16} /></a></article>
          </div>
        </div>
      </section>
    </main>
  )
}
