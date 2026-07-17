import { ArrowRight, BadgeCheck, CircleAlert, Download, ExternalLink, LoaderCircle, Search, Wallet } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, verifyCredential, type CredentialVerificationResponse } from '../lib/api'
import { buildContractExplorerUrl, createVerificationReceipt, downloadJson } from '../lib/credentialSharing'
import { shortenAddress } from '../lib/wallet'

type CredentialVerifierProps = {
  initialCredentialId?: string
  initialOwner?: string
  autoVerify?: boolean
  onVerified?: (result: CredentialVerificationResponse) => void
}

export function CredentialVerifier({
  initialCredentialId = '',
  initialOwner = '',
  autoVerify = false,
  onVerified,
}: CredentialVerifierProps) {
  const [credentialId, setCredentialId] = useState(initialCredentialId)
  const [owner, setOwner] = useState(initialOwner)
  const [status, setStatus] = useState<'idle' | 'loading' | 'verified' | 'inactive' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<CredentialVerificationResponse | null>(null)
  const [verifiedAt, setVerifiedAt] = useState('')
  const autoVerifyStarted = useRef(false)

  const runVerification = useCallback(async (candidateCredentialId: string, candidateOwner: string) => {
    if (!candidateCredentialId.trim() || !candidateOwner.trim()) return
    setStatus('loading')
    setMessage('')
    setResult(null)

    try {
      const verification = await verifyCredential(candidateCredentialId.trim().toLowerCase(), candidateOwner.trim().toUpperCase())
      setResult(verification)
      setVerifiedAt(new Date().toISOString())
      setStatus(verification.active ? 'verified' : 'inactive')
      if (verification.active) onVerified?.(verification)
    } catch (caughtError) {
      const apiError = caughtError instanceof ApiError ? caughtError : null
      setMessage(caughtError instanceof Error ? caughtError.message : 'Credential verification could not be completed.')
      setStatus(apiError?.status === 404 ? 'inactive' : 'error')
    }
  }, [onVerified])

  useEffect(() => {
    if (!autoVerify || autoVerifyStarted.current || !initialCredentialId || !initialOwner) return
    autoVerifyStarted.current = true
    void runVerification(initialCredentialId, initialOwner)
  }, [autoVerify, initialCredentialId, initialOwner, runVerification])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await runVerification(credentialId, owner)
  }

  const downloadReceipt = () => {
    if (!result) return
    const receipt = createVerificationReceipt(result, verifiedAt)
    downloadJson(`skillchain-verification-${result.credential_id.slice(0, 12)}.json`, receipt)
  }

  return (
    <>
      <form className="verification-form" onSubmit={(event) => void submit(event)}>
        <label><span>Credential ID</span><div><Search size={18} /><input value={credentialId} onChange={(event) => { setCredentialId(event.target.value); setStatus('idle') }} placeholder="64-character credential ID" minLength={64} maxLength={64} required /></div></label>
        <label><span>Credential owner</span><div><Wallet size={18} /><input value={owner} onChange={(event) => { setOwner(event.target.value); setStatus('idle') }} placeholder="G... Stellar wallet address" minLength={56} maxLength={56} required /></div></label>
        <button className="button button--primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? <><LoaderCircle className="spin" size={16} /> Checking Stellar</> : <>Verify credential <ArrowRight size={16} /></>}</button>
      </form>
      {status === 'verified' && result && (
        <div className="verification-result verification-result--verified">
          <BadgeCheck size={25} />
          <div className="verification-result__content">
            <strong>Credential verified</strong>
            <span>This credential is active on Stellar and belongs to {shortenAddress(result.owner)}.</span>
            <dl>
              <div><dt>Network</dt><dd>{result.network}</dd></div>
              <div><dt>Contract</dt><dd>{result.contract_id}</dd></div>
              <div><dt>Checked</dt><dd>{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(verifiedAt))}</dd></div>
            </dl>
            <div className="verification-result__actions">
              <button type="button" onClick={downloadReceipt}><Download size={14} /> Download proof</button>
              <a href={buildContractExplorerUrl(result.network, result.contract_id)} target="_blank" rel="noreferrer">View contract <ExternalLink size={13} /></a>
            </div>
          </div>
        </div>
      )}
      {status === 'inactive' && <div className="verification-result verification-result--inactive"><CircleAlert size={22} /><div><strong>Credential is not active</strong><span>No active credential matches this ID and wallet combination.</span></div></div>}
      {status === 'error' && <div className="verification-result verification-result--inactive"><CircleAlert size={22} /><div><strong>Verification unavailable</strong><span>{message}</span></div></div>}
    </>
  )
}
