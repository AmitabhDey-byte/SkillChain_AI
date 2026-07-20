import {
  Activity,
  BadgeCheck,
  Blocks,
  Check,
  Database,
  Fingerprint,
  Gauge,
  KeyRound,
  LockKeyhole,
  Radio,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLiveHealth, getReadyHealth, type LiveHealthResponse, type ReadyHealthResponse } from '../lib/api'
import type { WalletConnection } from '../lib/wallet'
import { PublicNav } from './PublicNav'

type TrustCenterProps = {
  connection: WalletConnection | null
  onWallet: () => void
  onEnter: () => void
}

const controls = [
  { icon: Fingerprint, title: 'Signed wallet sessions', text: 'Every protected action is bound to a one-time Stellar wallet signature.' },
  { icon: LockKeyhole, title: 'Server-side authorization', text: 'Credential ownership, recruiter actions, and admin access are validated by the API.' },
  { icon: Gauge, title: 'Abuse resistance', text: 'Request size limits, route-aware throttling, strict hosts, and security headers reduce attack surface.' },
  { icon: BadgeCheck, title: 'Evidence attestations', text: 'AI reports receive signed server attestations before they can become credentials.' },
  { icon: Blocks, title: 'Soroban verification', text: 'Credential ownership and active status are independently verifiable on Stellar testnet.' },
  { icon: KeyRound, title: 'No private-key custody', text: 'SkillChain never receives, stores, or asks for a wallet seed phrase or secret key.' },
]

export function TrustCenter({ connection, onWallet, onEnter }: TrustCenterProps) {
  const [live, setLive] = useState<LiveHealthResponse | null>(null)
  const [ready, setReady] = useState<ReadyHealthResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([getLiveHealth(controller.signal), getReadyHealth(controller.signal)])
      .then(([liveResult, readyResult]) => {
        setLive(liveResult)
        setReady(readyResult)
      })
      .catch(() => setFailed(true))
    return () => controller.abort()
  }, [])

  return (
    <main className="public-shell trust-page">
      <PublicNav connection={connection} onWallet={onWallet} onEnter={onEnter} />
      <section className="trust-hero">
        <div>
          <p className="cosmic-kicker"><ShieldCheck size={14} /> TRUST CENTER</p>
          <h1>Proof needs<br /><em>protection.</em></h1>
          <p>Explore the security boundaries, service health, and verification architecture behind SkillChain AI.</p>
        </div>
        <div className="trust-radar">
          <span className="trust-radar__core"><ShieldCheck /></span>
          <i /><i /><i />
          <b>WALLET</b><b>API</b><b>CHAIN</b>
        </div>
      </section>

      <section className="status-board">
        <div className="status-board__title"><Radio size={17} /><span>LIVE SYSTEM STATUS</span><small>{failed ? 'Unavailable' : live ? 'Connected' : 'Checking'}</small></div>
        <div><Activity /><span><small>API</small><strong>{live?.status || (failed ? 'offline' : 'checking')}</strong></span></div>
        <div><Database /><span><small>DATABASE</small><strong>{ready?.dependencies.database || 'checking'}</strong></span></div>
        <div><BadgeCheck /><span><small>GEMINI</small><strong>{ready?.dependencies.gemini || 'checking'}</strong></span></div>
        <div><Blocks /><span><small>STELLAR</small><strong>{ready?.dependencies.stellar || 'checking'}</strong></span></div>
      </section>

      <section className="trust-controls">
        <div className="section-orbit-heading">
          <p>CONTROL PLANE / 06</p>
          <h2>Security by boundary,<br />not by assumption.</h2>
        </div>
        <div className="trust-control-grid">
          {controls.map(({ icon: Icon, title, text }, index) => (
            <article key={title}>
              <span><Icon /></span>
              <small>0{index + 1}</small>
              <h3>{title}</h3>
              <p>{text}</p>
              <b><Check size={12} /> ACTIVE CONTROL</b>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-disclosure">
        <ShieldCheck />
        <div><p>RESPONSIBLE DISCLOSURE</p><h2>Found something we should know?</h2><span>Report security concerns privately through the project repository owner before public disclosure.</span></div>
      </section>
    </main>
  )
}
