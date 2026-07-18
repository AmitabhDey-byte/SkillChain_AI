import { Activity, Blocks, Bot, ChevronRight, CircleAlert, Database, KeyRound, LoaderCircle, LockKeyhole, LogOut, Menu, RefreshCw, ServerCog, ShieldCheck, Wallet, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLiveHealth, getReadyHealth, type LiveHealthResponse, type ReadyHealthResponse } from '../lib/api'
import { isAdminWallet } from '../lib/adminAccess'
import { shortenAddress, type WalletConnection } from '../lib/wallet'

type AdminDashboardProps = {
  connection: WalletConnection | null
  onOpenWallet: () => void
  onDisconnect: () => void
}

export function AdminDashboard({ connection, onOpenWallet, onDisconnect }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [live, setLive] = useState<LiveHealthResponse | null>(null)
  const [ready, setReady] = useState<ReadyHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const allowed = isAdminWallet(connection?.address)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const [liveResult, readyResult] = await Promise.all([getLiveHealth(), getReadyHealth()])
      setLive(liveResult)
      setReady(readyResult)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'System health could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!allowed) return
    const controller = new AbortController()

    Promise.all([getLiveHealth(controller.signal), getReadyHealth(controller.signal)])
      .then(([liveResult, readyResult]) => {
        setLive(liveResult)
        setReady(readyResult)
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
        setError(caughtError instanceof Error ? caughtError.message : 'System health could not be loaded.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [allowed])

  if (!allowed) {
    return (
      <main className="admin-access-page">
        <section><span><LockKeyhole size={31} /></span><p className="overline">ADMIN ACCESS</p><h1>Authorized wallet required.</h1><p>Connect a Stellar wallet listed in <code>VITE_ADMIN_WALLETS</code> to open platform operations.</p><button className="button button--primary" type="button" onClick={onOpenWallet}><Wallet size={17} /> {connection ? 'Switch wallet' : 'Connect admin wallet'}</button></section>
      </main>
    )
  }

  const dependencies = ready?.dependencies

  return (
    <main className="dashboard-layout admin-dashboard">
      <aside className={sidebarOpen ? 'dashboard-sidebar dashboard-sidebar--open' : 'dashboard-sidebar'}>
        <div className="dashboard-brand"><span><Blocks size={19} /></span> SkillChain <strong>Ops</strong></div>
        <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        <nav className="dashboard-nav" aria-label="Admin navigation"><p>OPERATIONS</p><button className="active" type="button"><Activity size={17} /><span>System health</span></button><button type="button" onClick={() => void refresh()}><RefreshCw size={17} /><span>Refresh status</span></button></nav>
        <div className="sidebar-wallet"><div><span className="wallet-dot" /><small>ADMIN WALLET</small></div><strong>{shortenAddress(connection!.address)}</strong><button type="button" onClick={onOpenWallet}>Manage wallet <ChevronRight size={13} /></button></div>
        <button className="sidebar-signout" type="button" onClick={onDisconnect}><LogOut size={15} /> Disconnect admin</button>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <section className="dashboard-main">
        <header className="dashboard-topbar"><div><button className="dashboard-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><span className="dashboard-breadcrumb">Admin <ChevronRight size={13} /> System health</span></div><div className="admin-status-chip"><span /> Authorized operator</div></header>
        <div className="dashboard-content">
          <div className="dashboard-welcome"><div><p className="overline">PLATFORM OPERATIONS</p><h1>Admin control center.</h1><p>Monitor production dependencies and the deployed credential infrastructure.</p></div><button className="button button--primary" type="button" onClick={() => void refresh()} disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />} Refresh health</button></div>
          {error && <div className="credential-error"><CircleAlert size={18} /><div><strong>Health check failed</strong><span>{error}</span></div></div>}
          <div className="metric-grid">
            <article><div className="metric-icon metric-icon--green"><Activity size={19} /></div><div><span>API status</span><strong className="metric-text-value">{live?.status || 'Checking'}</strong><small>{live?.service || 'FastAPI service'}</small></div></article>
            <article><div className="metric-icon metric-icon--blue"><Database size={19} /></div><div><span>Database</span><strong className="metric-text-value">{dependencies?.database || 'Checking'}</strong><small>PostgreSQL metadata</small></div></article>
            <article><div className="metric-icon metric-icon--amber"><Bot size={19} /></div><div><span>Gemini AI</span><strong className="metric-text-value">{dependencies?.gemini || 'Checking'}</strong><small>Assessment engine</small></div></article>
            <article><div className="metric-icon metric-icon--violet"><ShieldCheck size={19} /></div><div><span>Stellar contract</span><strong className="metric-text-value">{dependencies?.stellar || 'Checking'}</strong><small>Credential gateway</small></div></article>
          </div>
          <div className="admin-operations-grid">
            <article className="dashboard-card"><div className="card-heading"><div><p className="overline">SERVICE READINESS</p><h2>Production dependencies</h2></div><span className={ready?.status === 'ready' ? 'workspace-status workspace-status--complete' : 'workspace-status'}>{ready?.status || 'Loading'}</span></div><div className="admin-dependency-list"><div><Database size={17} /><span><strong>PostgreSQL</strong><small>Application metadata store</small></span><b>{dependencies?.database || 'checking'}</b></div><div><Bot size={17} /><span><strong>Gemini</strong><small>Portfolio evaluation service</small></span><b>{dependencies?.gemini || 'checking'}</b></div><div><ShieldCheck size={17} /><span><strong>Stellar testnet</strong><small>Soroban credential contract</small></span><b>{dependencies?.stellar || 'checking'}</b></div></div></article>
            <article className="dashboard-card"><div className="card-heading"><div><p className="overline">DEPLOYMENT</p><h2>Runtime identity</h2></div><ServerCog size={19} /></div><dl className="admin-runtime-list"><div><dt>Environment</dt><dd>{ready?.environment || 'Loading'}</dd></div><div><dt>API version</dt><dd>{live?.version || 'Loading'}</dd></div><div><dt>Last heartbeat</dt><dd>{live ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(live.timestamp)) : 'Loading'}</dd></div><div><dt>Operator</dt><dd>{shortenAddress(connection!.address)}</dd></div></dl><div className="admin-security-note"><KeyRound size={16} /><span>Administrative access is restricted by the configured wallet allowlist.</span></div></article>
          </div>
        </div>
      </section>
    </main>
  )
}
