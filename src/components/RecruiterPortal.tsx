import { ArrowLeft, BadgeCheck, Blocks, BriefcaseBusiness, Check, Clock3, ExternalLink, Search, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CredentialVerificationResponse } from '../lib/api'
import { buildVerificationUrl } from '../lib/credentialSharing'
import { shortenAddress } from '../lib/wallet'
import { CredentialVerifier } from './CredentialVerifier'

type VerificationHistoryItem = CredentialVerificationResponse & {
  verified_at: string
}

const HISTORY_KEY = 'skillchain.recruiter.verificationHistory'

function loadHistory(): VerificationHistoryItem[] {
  const saved = localStorage.getItem(HISTORY_KEY)
  if (!saved) return []

  try {
    const history = JSON.parse(saved) as VerificationHistoryItem[]
    return Array.isArray(history) ? history.slice(0, 5) : []
  } catch {
    return []
  }
}

export function RecruiterPortal() {
  const navigate = useNavigate()
  const [history, setHistory] = useState(loadHistory)

  const recordVerification = (result: CredentialVerificationResponse) => {
    const nextItem = { ...result, verified_at: new Date().toISOString() }
    const nextHistory = [nextItem, ...history.filter((item) => item.credential_id !== result.credential_id)].slice(0, 5)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
    setHistory(nextHistory)
  }

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setHistory([])
  }

  return (
    <main className="recruiter-page">
      <header className="recruiter-header">
        <button className="brand" type="button" onClick={() => navigate('/')}><span className="brand-mark"><Blocks size={20} /></span><span>SkillChain <strong>AI</strong></span></button>
        <button className="back-button" type="button" onClick={() => navigate('/')}><ArrowLeft size={15} /> Back to home</button>
      </header>

      <section className="recruiter-hero">
        <div>
          <p className="overline">RECRUITER VERIFICATION DESK</p>
          <h1>Validate technical proof before the interview.</h1>
          <p>Check credential ownership and active status directly against Stellar. No candidate account access, wallet connection, or manual certificate review required.</p>
        </div>
        <div className="recruiter-trust-grid">
          <article><ShieldCheck size={20} /><strong>On-chain truth</strong><span>Reads the configured Stellar credential contract.</span></article>
          <article><Clock3 size={20} /><strong>Instant review</strong><span>Get a clear active or inactive result in seconds.</span></article>
          <article><BriefcaseBusiness size={20} /><strong>Hiring ready</strong><span>Keep recent verification checks in this browser.</span></article>
        </div>
      </section>

      <section className="recruiter-workspace">
        <div className="recruiter-tool-heading"><div><p className="overline">LIVE CREDENTIAL CHECK</p><h2>Verify a candidate</h2><p>Ask the candidate for their credential ID and Stellar wallet address.</p></div><span><span /> Stellar testnet gateway</span></div>
        <CredentialVerifier onVerified={recordVerification} />
      </section>

      <section className="recruiter-history">
        <div className="recruiter-tool-heading">
          <div><p className="overline">RECENT REVIEWS</p><h2>Verification history</h2><p>Stored locally for quick comparison during your current hiring workflow.</p></div>
          {history.length > 0 && <button type="button" onClick={clearHistory}><Trash2 size={14} /> Clear history</button>}
        </div>
        {history.length > 0 ? (
          <div className="recruiter-history-list">
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
          <div className="recruiter-history-empty"><Search size={24} /><strong>No candidates verified yet</strong><span>Your latest successful checks will appear here.</span></div>
        )}
      </section>
    </main>
  )
}
