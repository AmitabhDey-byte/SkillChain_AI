import { ArrowUpRight, Menu, ShieldCheck, Wallet, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isTestnet, shortenAddress, type WalletConnection } from '../lib/wallet'
import { BrandMark } from './BrandMark'

type PublicNavProps = {
  connection?: WalletConnection | null
  onWallet?: () => void
  onEnter?: () => void
}

export function PublicNav({ connection, onWallet, onEnter }: PublicNavProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <header className="cosmic-nav">
      <button className="cosmic-nav__brand" type="button" onClick={() => go('/')}>
        <BrandMark />
      </button>
      <nav className={open ? 'cosmic-nav__links cosmic-nav__links--open' : 'cosmic-nav__links'} aria-label="Primary navigation">
        <button type="button" onClick={() => go('/explore')}>Explore</button>
        <button type="button" onClick={() => go('/recruiters')}>For teams</button>
        <button type="button" onClick={() => go('/verify')}><ShieldCheck size={14} /> Verify proof</button>
        <button type="button" onClick={() => go('/trust')}>Trust center</button>
      </nav>
      <div className="cosmic-nav__actions">
        {connection && onEnter && (
          <button className="nav-enter" type="button" onClick={onEnter}>
            Enter app <ArrowUpRight size={15} />
          </button>
        )}
        {onWallet && (
          <button className="nav-wallet" type="button" onClick={onWallet}>
            <span className={connection && isTestnet(connection.network) ? 'wallet-dot' : ''} />
            {connection ? shortenAddress(connection.address) : <><Wallet size={15} /> Connect</>}
          </button>
        )}
        <button className="cosmic-nav__menu" type="button" aria-label="Toggle navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
