import { AlertTriangle, ArrowUpRight, Check, LoaderCircle, ShieldCheck, Wallet, X } from 'lucide-react'
import { isTestnet, shortenAddress, type WalletConnection } from '../lib/wallet'

type WalletModalProps = {
  open: boolean
  status: 'checking' | 'disconnected' | 'connecting' | 'connected' | 'error'
  connection: WalletConnection | null
  error: string | null
  onClose: () => void
  onContinue: () => void
  onConnect: () => Promise<boolean>
  onDisconnect: () => void
}

export function WalletModal({
  open,
  status,
  connection,
  error,
  onClose,
  onContinue,
  onConnect,
  onDisconnect,
}: WalletModalProps) {
  if (!open) return null

  const connectedToTestnet = connection ? isTestnet(connection.network) : false

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="wallet-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" aria-label="Close wallet dialog" onClick={onClose}>
          <X size={19} />
        </button>

        {status === 'connected' && connection ? (
          <>
            <div className="modal-icon modal-icon--success"><Check size={24} /></div>
            <p className="overline modal-kicker">WALLET CONNECTED</p>
            <h2 id="wallet-modal-title">Your identity is ready.</h2>
            <p className="modal-copy">This wallet will own every SkillChain credential issued to your profile.</p>

            <div className="wallet-detail-card">
              <div className="wallet-detail-row">
                <span>Account</span>
                <strong>{shortenAddress(connection.address)}</strong>
              </div>
              <div className="wallet-detail-row">
                <span>Network</span>
                <strong className={connectedToTestnet ? 'network-ok' : 'network-warning'}>
                  <span /> {connection.network}
                </strong>
              </div>
            </div>

            {!connectedToTestnet && (
              <div className="wallet-warning">
                <AlertTriangle size={18} />
                <span>Switch Freighter to Stellar Testnet before issuing credentials.</span>
              </div>
            )}

            <div className="modal-actions">
              <button className="button button--primary button--wide" type="button" onClick={onContinue}>
                Continue to SkillChain <ArrowUpRight size={17} />
              </button>
              <button className="disconnect-button" type="button" onClick={onDisconnect}>Disconnect wallet</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-icon"><Wallet size={24} /></div>
            <p className="overline modal-kicker">STELLAR IDENTITY</p>
            <h2 id="wallet-modal-title">Connect your wallet.</h2>
            <p className="modal-copy">Use Freighter to sign in securely. SkillChain never sees or stores your private keys.</p>

            <button
              className="wallet-option"
              type="button"
              disabled={status === 'connecting' || status === 'checking'}
              onClick={() => void onConnect()}
            >
              <span className="freighter-mark">F</span>
              <span><strong>Freighter</strong><small>Recommended Stellar wallet</small></span>
              {status === 'connecting' ? <LoaderCircle className="spin" size={20} /> : <ArrowUpRight size={19} />}
            </button>

            {error && (
              <div className="wallet-error" role="alert">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            <div className="security-note">
              <ShieldCheck size={17} />
              <span>Permission is limited to viewing your public address and requesting signatures.</span>
            </div>

            <a className="install-link" href="https://www.freighter.app/" target="_blank" rel="noreferrer">
              Don’t have Freighter? Install it <ArrowUpRight size={13} />
            </a>
          </>
        )}
      </section>
    </div>
  )
}
