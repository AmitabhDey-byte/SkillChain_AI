import { ArrowRight, BadgeCheck, CircleAlert, LoaderCircle, Search, Wallet } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { ApiError, verifyCredential } from '../lib/api'
import { shortenAddress } from '../lib/wallet'

type CredentialVerifierProps = {
  initialCredentialId?: string
  initialOwner?: string
}

export function CredentialVerifier({
  initialCredentialId = '',
  initialOwner = '',
}: CredentialVerifierProps) {
  const [credentialId, setCredentialId] = useState(initialCredentialId)
  const [owner, setOwner] = useState(initialOwner)
  const [status, setStatus] = useState<'idle' | 'loading' | 'verified' | 'inactive' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!credentialId.trim() || !owner.trim()) return
    setStatus('loading')
    setMessage('')

    try {
      const result = await verifyCredential(credentialId.trim().toLowerCase(), owner.trim().toUpperCase())
      setStatus(result.active ? 'verified' : 'inactive')
    } catch (caughtError) {
      const apiError = caughtError instanceof ApiError ? caughtError : null
      setMessage(caughtError instanceof Error ? caughtError.message : 'Credential verification could not be completed.')
      setStatus(apiError?.status === 404 ? 'inactive' : 'error')
    }
  }

  return (
    <>
      <form className="verification-form" onSubmit={(event) => void submit(event)}>
        <label><span>Credential ID</span><div><Search size={18} /><input value={credentialId} onChange={(event) => { setCredentialId(event.target.value); setStatus('idle') }} placeholder="64-character credential ID" minLength={64} maxLength={64} required /></div></label>
        <label><span>Credential owner</span><div><Wallet size={18} /><input value={owner} onChange={(event) => { setOwner(event.target.value); setStatus('idle') }} placeholder="G... Stellar wallet address" minLength={56} maxLength={56} required /></div></label>
        <button className="button button--primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? <><LoaderCircle className="spin" size={16} /> Checking Stellar</> : <>Verify credential <ArrowRight size={16} /></>}</button>
      </form>
      {status === 'verified' && <div className="verification-result verification-result--verified"><BadgeCheck size={25} /><div><strong>Credential verified</strong><span>This credential is active on Stellar and belongs to {shortenAddress(owner)}.</span></div></div>}
      {status === 'inactive' && <div className="verification-result verification-result--inactive"><CircleAlert size={22} /><div><strong>Credential is not active</strong><span>No active credential matches this ID and wallet combination.</span></div></div>}
      {status === 'error' && <div className="verification-result verification-result--inactive"><CircleAlert size={22} /><div><strong>Verification unavailable</strong><span>{message}</span></div></div>}
    </>
  )
}
