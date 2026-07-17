import { ArrowLeft, BadgeCheck, Blocks, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CredentialVerifier } from './CredentialVerifier'

export function PublicVerification() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const credentialId = searchParams.get('credential') || ''
  const owner = searchParams.get('owner') || ''
  const hasSharedCredential = credentialId.length === 64 && owner.length === 56

  return (
    <main className="public-verification-page">
      <header className="public-verification-header">
        <button className="brand" type="button" onClick={() => navigate('/')}><span className="brand-mark"><Blocks size={20} /></span><span>SkillChain <strong>AI</strong></span></button>
        <button className="back-button" type="button" onClick={() => navigate('/')}><ArrowLeft size={15} /> Back to home</button>
      </header>
      <section className="public-verification-shell">
        <div className="public-verification-intro">
          <span><ShieldCheck size={27} /></span>
          <p className="overline">PUBLIC STELLAR VERIFICATION</p>
          <h1>Verify skills without trusting a résumé.</h1>
          <p>Enter the credential ID and claimed wallet address. SkillChain checks ownership and revocation status directly against the Stellar contract.</p>
        </div>
        <div className="public-verification-panel">
          <div><BadgeCheck size={18} /><span><strong>Cryptographic proof</strong><small>No account or wallet connection required</small></span></div>
          <CredentialVerifier initialCredentialId={credentialId} initialOwner={owner} autoVerify={hasSharedCredential} />
        </div>
      </section>
    </main>
  )
}
