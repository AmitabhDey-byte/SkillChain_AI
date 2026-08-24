import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  GraduationCap,
  LoaderCircle,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import {
  ApiError,
  fundCheckinWallet,
  prepareOnchainCheckin,
  submitOnchainCheckin,
  type CheckinReceipt,
  type CheckinRole,
} from '../lib/api'
import { isTestnet, shortenAddress, signCheckinTransaction, type WalletConnection } from '../lib/wallet'
import { PublicNav } from './PublicNav'

type CheckinState = 'idle' | 'preparing' | 'signing' | 'submitting' | 'funding' | 'success'

type OnchainCheckinProps = {
  connection: WalletConnection | null
  onWallet: () => void
  onEnter: () => void
}

const roleOptions: { value: CheckinRole; label: string; icon: typeof Code2 }[] = [
  { value: 'developer', label: 'Developer', icon: Code2 },
  { value: 'freelancer', label: 'Freelancer', icon: BriefcaseBusiness },
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'recruiter', label: 'Recruiter', icon: SearchCheck },
]

function statusLabel(state: CheckinState) {
  if (state === 'preparing') return 'Building transaction'
  if (state === 'signing') return 'Waiting for wallet'
  if (state === 'submitting') return 'Confirming on Stellar'
  if (state === 'funding') return 'Funding testnet wallet'
  return 'Review and sign'
}

export function OnchainCheckin({ connection, onWallet, onEnter }: OnchainCheckinProps) {
  const [role, setRole] = useState<CheckinRole>('developer')
  const [intent, setIntent] = useState('Building verifiable proof of work')
  const [state, setState] = useState<CheckinState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [unfunded, setUnfunded] = useState(false)
  const [receipt, setReceipt] = useState<CheckinReceipt | null>(null)
  const [copied, setCopied] = useState(false)
  const busy = !['idle', 'success'].includes(state)
  const walletReady = Boolean(connection && isTestnet(connection.network))

  const createCheckin = async () => {
    if (!connection) {
      onWallet()
      return
    }
    if (!isTestnet(connection.network)) {
      setError('Switch your wallet to Stellar Testnet, then try again.')
      return
    }
    const normalizedIntent = intent.trim()
    if (normalizedIntent.length < 3) {
      setError('Add a short reason for joining SkillChain.')
      return
    }
    setError(null)
    setUnfunded(false)
    setReceipt(null)
    try {
      setState('preparing')
      const prepared = await prepareOnchainCheckin(connection.address, role, normalizedIntent)
      setState('signing')
      const signedXdr = await signCheckinTransaction(connection, prepared.transaction_xdr)
      setState('submitting')
      const result = await submitOnchainCheckin(connection.address, role, normalizedIntent, signedXdr)
      setReceipt(result)
      setState('success')
    } catch (caughtError) {
      const apiError = caughtError instanceof ApiError ? caughtError : null
      setUnfunded(apiError?.code === 'stellar_account_unfunded')
      setError(caughtError instanceof Error ? caughtError.message : 'The check-in could not be completed.')
      setState('idle')
    }
  }

  const fundWallet = async () => {
    if (!connection) return
    setState('funding')
    setError(null)
    try {
      await fundCheckinWallet(connection.address)
      setUnfunded(false)
      setState('idle')
      setError('Your testnet wallet is funded. You can now review and sign the check-in.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'The wallet could not be funded.')
      setState('idle')
    }
  }

  const copyHash = async () => {
    if (!receipt) return
    await navigator.clipboard.writeText(receipt.transaction_hash)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const reset = () => {
    setReceipt(null)
    setError(null)
    setState('idle')
  }

  return (
    <main className="checkin-page">
      <PublicNav connection={connection} onWallet={onWallet} onEnter={connection ? onEnter : undefined} />
      <section className="checkin-layout">
        <div className="checkin-intro">
          <p className="checkin-kicker"><span /> Open participation</p>
          <h1>Leave a real proof that you showed up.</h1>
          <p className="checkin-lead">Create a harmless Stellar testnet check-in without connecting GitHub. Your wallet signs a small on-chain marker and SkillChain returns a real transaction receipt you can share.</p>
          <ol className="checkin-principles">
            <li><span>01</span><div><strong>No GitHub required</strong><p>Check-in is separate from AI skill verification and credentials.</p></div></li>
            <li><span>02</span><div><strong>You approve the transaction</strong><p>Freighter or Albedo signs it. SkillChain never sees a private key.</p></div></li>
            <li><span>03</span><div><strong>A verifiable receipt</strong><p>The transaction hash links directly to Stellar Expert testnet.</p></div></li>
          </ol>
        </div>

        <section className="checkin-card" aria-live="polite">
          <header className="checkin-card__header">
            <div><p>Stellar testnet</p><h2>On-chain check-in</h2></div>
            <span className={walletReady ? 'checkin-wallet-state checkin-wallet-state--ready' : 'checkin-wallet-state'}>
              {walletReady ? <CheckCircle2 size={15} /> : <Wallet size={15} />}
              {connection ? (walletReady ? 'Wallet connected' : 'Wrong network') : 'Wallet required'}
            </span>
          </header>

          {receipt ? (
            <div className="checkin-receipt">
              <span className="checkin-receipt__icon"><Check size={30} /></span>
              <p>Check-in confirmed</p>
              <h2>Your proof is on Stellar.</h2>
              <div className="checkin-receipt__hash">
                <span>Transaction hash</span>
                <code>{receipt.transaction_hash}</code>
                <button type="button" onClick={() => void copyHash()}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy hash'}</button>
              </div>
              <dl className="checkin-receipt__facts">
                <div><dt>Role</dt><dd>{receipt.role}</dd></div>
                <div><dt>Ledger</dt><dd>{receipt.ledger_sequence}</dd></div>
                <div><dt>Wallet</dt><dd title={receipt.wallet_address}>{shortenAddress(receipt.wallet_address)}</dd></div>
                <div><dt>Network</dt><dd>{receipt.network}</dd></div>
              </dl>
              <div className="checkin-receipt__actions">
                <a href={receipt.explorer_url} target="_blank" rel="noreferrer">Open Stellar receipt <ExternalLink size={16} /></a>
                <button type="button" onClick={reset}>Create another check-in</button>
              </div>
            </div>
          ) : (
            <div className="checkin-form">
              <div className="checkin-progress"><span /><span /><span /></div>
              <fieldset>
                <legend>How are you joining SkillChain?</legend>
                <p>This role is included in the public check-in marker.</p>
                <div className="checkin-roles">
                  {roleOptions.map(({ value, label, icon: Icon }) => (
                    <button className={role === value ? 'active' : ''} type="button" key={value} onClick={() => setRole(value)} disabled={busy}>
                      <Icon size={21} /><span>{label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="checkin-intent">
                <span>What brings you here?</span>
                <div><input value={intent} onChange={(event) => setIntent(event.target.value)} maxLength={40} disabled={busy} /><small>{intent.length}/40</small></div>
              </label>

              <div className="checkin-preview">
                <div><strong>Transaction preview</strong><span>Fee ≈ 0.00001 XLM</span></div>
                <dl>
                  <div><dt>Operation</dt><dd>Manage Data</dd></div>
                  <div><dt>Data key</dt><dd>skillchain_checkin</dd></div>
                  <div><dt>Wallet</dt><dd>{connection ? shortenAddress(connection.address) : 'Connect wallet'}</dd></div>
                  <div><dt>Network</dt><dd>{connection?.network || 'TESTNET'}</dd></div>
                </dl>
              </div>

              {error && <div className={unfunded ? 'checkin-message checkin-message--fund' : 'checkin-message'}><Sparkles size={18} /><span>{error}</span>{unfunded && <button type="button" onClick={() => void fundWallet()} disabled={busy}>Fund wallet</button>}</div>}

              <div className="checkin-submit-row">
                <button className="checkin-submit" type="button" onClick={() => void createCheckin()} disabled={busy}>
                  {busy ? <LoaderCircle className="spin" size={19} /> : connection ? <ShieldCheck size={19} /> : <Wallet size={19} />}
                  {connection ? statusLabel(state) : 'Connect wallet to check in'}
                  {!busy && <ArrowUpRight size={18} />}
                </button>
                <span><ShieldCheck size={17} /> No payment or GitHub access</span>
              </div>
            </div>
          )}

          <footer className="checkin-card__footer">
            <div><span>Real network proof</span><strong>Transaction hash</strong></div>
            <div><span>Wallet support</span><strong>Freighter + Albedo</strong></div>
            <div><span>Credential impact</span><strong>None</strong></div>
          </footer>
        </section>
      </section>
    </main>
  )
}
