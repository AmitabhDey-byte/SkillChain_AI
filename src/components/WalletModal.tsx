import { AlertTriangle, ArrowUpRight, Check, LoaderCircle, ShieldCheck, Smartphone, Wallet, X } from 'lucide-react'
import { isTestnet, shortenAddress, type WalletConnection, type WalletType } from '../lib/wallet'

type WalletModalProps = {
  open: boolean
  status: 'checking' | 'disconnected' | 'connecting' | 'connected' | 'error'
  connection: WalletConnection | null
  error: string | null
  onClose: () => void
  onContinue: () => void
  onConnect: (walletType: WalletType) => Promise<boolean>
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
  const walletName = connection?.walletType === 'albedo' ? 'Albedo' : 'Freighter'

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
            <p className="overline modal-kicker">IDENTITY VERIFIED</p>
            <h2 id="wallet-modal-title">Your proof layer is live.</h2>
            <p className="modal-copy">A signed {walletName} session protects every SkillChain action without exposing private keys.</p>

            <div className="wallet-detail-card">
              <div className="wallet-detail-row">
                <span>Account</span>
                <strong>{shortenAddress(connection.address)}</strong>
              </div>
              <div className="wallet-detail-row">
                <span>Wallet</span>
                <strong>{walletName}</strong>
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
                <span>Switch your wallet to Stellar Testnet before issuing credentials.</span>
              </div>
            )}

            <div className="modal-actions">
              <button className="button button--primary button--wide" type="button" onClick={onContinue}>
                Enter SkillChain <ArrowUpRight size={17} />
              </button>
              <button className="disconnect-button" type="button" onClick={onDisconnect}>Disconnect wallet</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-icon"><Wallet size={24} /></div>
            <p className="overline modal-kicker">STELLAR IDENTITY</p>
            <h2 id="wallet-modal-title">Choose your wallet.</h2>
            <p className="modal-copy">Sign a one-time challenge to create a secure session. This request cannot move funds.</p>

            <div className="wallet-options">
              <button
                className="wallet-option"
                type="button"
                disabled={status === 'connecting' || status === 'checking'}
                onClick={() => void onConnect('freighter')}
              >
                <span className="freighter-mark">F</span>
                <span><strong>Freighter</strong><small>Browser extension</small></span>
                {status === 'connecting' ? <LoaderCircle className="spin" size={20} /> : <ArrowUpRight size={19} />}
              </button>

              <button
                className="wallet-option wallet-option--albedo"
                type="button"
                disabled={status === 'connecting' || status === 'checking'}
                onClick={() => void onConnect('albedo')}
              >
                <span className="albedo-mark"><Smartphone size={19} /></span>
                <span><strong>Albedo</strong><small>Mobile-friendly web wallet</small></span>
                {status === 'connecting' ? <LoaderCircle className="spin" size={20} /> : <ArrowUpRight size={19} />}
              </button>
            </div>

            {error && (
              <div className="wallet-error" role="alert">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            <div className="security-note">
              <ShieldCheck size={17} />
              <span>Permission is limited to your public address and an authentication signature.</span>
            </div>

            <div className="wallet-install-links">
              <a className="install-link" href="https://www.freighter.app/" target="_blank" rel="noreferrer">
                Get Freighter <ArrowUpRight size={13} />
              </a>
              <a className="install-link" href="https://albedo.link/" target="_blank" rel="noreferrer">
                Open Albedo <ArrowUpRight size={13} />
              </a>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
