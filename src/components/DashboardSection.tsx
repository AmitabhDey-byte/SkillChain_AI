import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleAlert,
  Clipboard,
  Code2,
  FileCheck2,
  GitBranch,
  Globe2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type { AssessmentRunResult, GithubRepository } from '../lib/api'
import type { OnboardingProfile } from '../lib/onboarding'
import { shortenAddress, type WalletConnection } from '../lib/wallet'

export type DashboardSectionName = 'Overview' | 'Assessments' | 'Credentials' | 'Verification' | 'Public profile' | 'Settings'

type DashboardSectionProps = {
  section: Exclude<DashboardSectionName, 'Overview'>
  profile: OnboardingProfile
  connection: WalletConnection | null
  assessmentResult: AssessmentRunResult | null
  repositories: GithubRepository[]
  onNewAssessment: () => void
  onViewAssessment: () => void
  onOpenWallet: () => void
}

function AssessmentsSection({
  assessmentResult,
  repositories,
  onNewAssessment,
  onViewAssessment,
}: Pick<DashboardSectionProps, 'assessmentResult' | 'repositories' | 'onNewAssessment' | 'onViewAssessment'>) {
  return (
    <>
      <div className="workspace-heading"><div><p className="overline">AI VERIFICATION</p><h1>Assessments</h1><p>Turn selected public repositories into a transparent, evidence-backed skill report.</p></div><button className="button button--primary" type="button" onClick={onNewAssessment}><Sparkles size={17} /> New assessment</button></div>
      {assessmentResult ? (
        <article className="workspace-feature-card assessment-history-card">
          <div className="history-score"><strong>{assessmentResult.assessment.overall_score}</strong><span>/100</span></div>
          <div><span className="workspace-status workspace-status--complete"><Check size={12} /> Complete</span><h2>{assessmentResult.assessment.level} technical profile</h2><p>{assessmentResult.assessment.summary}</p><div className="history-meta"><span><GitBranch size={13} /> {assessmentResult.evidence_summary.successful} repositories</span><span><Code2 size={13} /> {assessmentResult.assessment.skills.length} verified skills</span><span><ShieldCheck size={13} /> {Math.round(assessmentResult.assessment.confidence * 100)}% confidence</span></div></div>
          <button className="button button--workspace" type="button" onClick={onViewAssessment}>Open report <ArrowRight size={16} /></button>
        </article>
      ) : (
        <article className="workspace-empty-card"><span><Sparkles size={28} /></span><h2>No completed assessment yet</h2><p>{repositories.length ? `${repositories.length} repositories are saved in your draft. Continue to collect evidence and generate your report.` : 'Choose one to five repositories that best demonstrate your technical work.'}</p><button className="button button--primary" type="button" onClick={onNewAssessment}>{repositories.length ? 'Continue draft' : 'Choose repositories'} <ArrowRight size={16} /></button></article>
      )}
    </>
  )
}

function CredentialsSection({
  assessmentResult,
  onViewAssessment,
}: Pick<DashboardSectionProps, 'assessmentResult' | 'onViewAssessment'>) {
  return (
    <>
      <div className="workspace-heading"><div><p className="overline">STELLAR CREDENTIALS</p><h1>Credentials</h1><p>Manage portable, tamper-proof skill credentials owned by your Stellar wallet.</p></div></div>
      <article className={assessmentResult ? 'credential-readiness credential-readiness--ready' : 'credential-readiness'}>
        <span>{assessmentResult ? <BadgeCheck size={29} /> : <LockKeyhole size={29} />}</span>
        <div><p className="overline">{assessmentResult ? 'READY FOR ISSUANCE' : 'ASSESSMENT REQUIRED'}</p><h2>{assessmentResult ? 'Your AI report is credential-ready.' : 'Complete verification before issuing.'}</h2><p>{assessmentResult ? `The validated score of ${assessmentResult.assessment.overall_score}/100 can be anchored to your connected Stellar identity in the credential issuance step.` : 'On-chain credentials require a completed, validated SkillChain AI assessment.'}</p></div>
        <button className="button button--workspace" type="button" onClick={onViewAssessment} disabled={!assessmentResult}>{assessmentResult ? 'Review issuance report' : 'Credential locked'} <ArrowRight size={16} /></button>
      </article>
      <div className="credential-benefit-grid"><article><ShieldCheck /><strong>Tamper-proof</strong><span>Verification data is anchored to Stellar.</span></article><article><Wallet /><strong>Wallet-owned</strong><span>Your professional identity remains portable.</span></article><article><Globe2 /><strong>Publicly verifiable</strong><span>Recruiters can validate it instantly.</span></article></div>
    </>
  )
}

function VerificationSection() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    setSubmitted(true)
  }

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">PUBLIC VERIFICATION</p><h1>Verify a credential</h1><p>Look up a SkillChain credential using its public ID, transaction hash, or Stellar wallet.</p></div></div>
      <form className="verification-search" onSubmit={submit}><Search size={19} /><input value={query} onChange={(event) => { setQuery(event.target.value); setSubmitted(false) }} placeholder="Credential ID, transaction hash, or G... wallet address" /><button className="button button--primary" type="submit">Verify</button></form>
      {submitted ? <div className="verification-message"><CircleAlert size={19} /><div><strong>No issued credential found</strong><span>This workspace has not issued an on-chain credential matching “{query.trim()}” yet.</span></div></div> : <div className="verification-guide"><FileCheck2 size={24} /><div><strong>Instant cryptographic verification</strong><p>Once credential issuance is enabled, this search validates ownership, issuer, assessment score, transaction status, and revocation state directly against Stellar.</p></div></div>}
    </>
  )
}

function PublicProfileSection({
  profile,
  connection,
  assessmentResult,
}: Pick<DashboardSectionProps, 'profile' | 'connection' | 'assessmentResult'>) {
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (!connection) return
    await navigator.clipboard.writeText(connection.address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">PROFESSIONAL IDENTITY</p><h1>Public profile</h1><p>Preview the identity recruiters and clients will use to verify your work.</p></div></div>
      <article className="public-profile-card">
        <div className="public-profile-cover"><span>SKILLCHAIN PASSPORT</span><BadgeCheck size={22} /></div>
        <div className="public-profile-body">
          <span className="public-avatar">{profile.displayName.slice(0, 2).toUpperCase() || 'SC'}</span>
          <div className="public-profile-title"><div><h2>{profile.displayName}</h2><p>{profile.headline}</p><span>{profile.location || 'Location not specified'} · @{profile.githubUsername}</span></div>{assessmentResult && <div><strong>{assessmentResult.assessment.overall_score}</strong><span>{assessmentResult.assessment.level}</span></div>}</div>
          <div className="public-profile-stats"><div><strong>{assessmentResult?.assessment.skills.length || 0}</strong><span>Verified skills</span></div><div><strong>{assessmentResult?.evidence_summary.successful || 0}</strong><span>Projects analyzed</span></div><div><strong>{assessmentResult ? `${Math.round(assessmentResult.assessment.confidence * 100)}%` : '—'}</strong><span>AI confidence</span></div></div>
          <div className="public-wallet-row"><Wallet size={16} /><span>{connection ? shortenAddress(connection.address) : 'Wallet unavailable'}</span><button type="button" onClick={() => void copyAddress()} disabled={!connection}><Clipboard size={14} /> {copied ? 'Copied' : 'Copy address'}</button></div>
        </div>
      </article>
    </>
  )
}

function SettingsSection({
  connection,
  onOpenWallet,
}: Pick<DashboardSectionProps, 'connection' | 'onOpenWallet'>) {
  const [publicProfile, setPublicProfile] = useState(() => localStorage.getItem('skillchain.settings.publicProfile') !== 'false')
  const [productUpdates, setProductUpdates] = useState(() => localStorage.getItem('skillchain.settings.productUpdates') === 'true')

  const updateSetting = (key: string, value: boolean, setter: (next: boolean) => void) => {
    localStorage.setItem(key, String(value))
    setter(value)
  }

  return (
    <>
      <div className="workspace-heading"><div><p className="overline">ACCOUNT PREFERENCES</p><h1>Settings</h1><p>Control profile visibility, notifications, and your connected Stellar identity.</p></div></div>
      <div className="settings-grid">
        <article><div className="settings-title"><span><Globe2 size={18} /></span><div><strong>Public profile</strong><small>Allow recruiters to view your issued credentials.</small></div></div><button className={publicProfile ? 'settings-toggle settings-toggle--on' : 'settings-toggle'} type="button" aria-pressed={publicProfile} onClick={() => updateSetting('skillchain.settings.publicProfile', !publicProfile, setPublicProfile)}><span /></button></article>
        <article><div className="settings-title"><span><Sparkles size={18} /></span><div><strong>Product updates</strong><small>Receive important SkillChain release notifications.</small></div></div><button className={productUpdates ? 'settings-toggle settings-toggle--on' : 'settings-toggle'} type="button" aria-pressed={productUpdates} onClick={() => updateSetting('skillchain.settings.productUpdates', !productUpdates, setProductUpdates)}><span /></button></article>
        <article className="settings-wallet-card"><div className="settings-title"><span><Wallet size={18} /></span><div><strong>Connected wallet</strong><small>{connection ? shortenAddress(connection.address) : 'No wallet session'}</small></div></div><button className="button button--workspace" type="button" onClick={onOpenWallet}>Manage wallet</button></article>
      </div>
    </>
  )
}

export function DashboardSection(props: DashboardSectionProps) {
  if (props.section === 'Assessments') return <AssessmentsSection {...props} />
  if (props.section === 'Credentials') return <CredentialsSection {...props} />
  if (props.section === 'Verification') return <VerificationSection />
  if (props.section === 'Public profile') return <PublicProfileSection {...props} />
  return <SettingsSection {...props} />
}
