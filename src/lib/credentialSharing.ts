import type { CredentialIssueResponse, CredentialVerificationResponse } from './api'

type VerificationReceipt = CredentialVerificationResponse & {
  receipt_version: 'skillchain-verification-v1'
  verified_at: string
  verification_url: string
}

type CredentialPassport = CredentialIssueResponse & {
  passport_version: 'skillchain-passport-v1'
  exported_at: string
  verification_url: string
}

export function buildVerificationUrl(credentialId: string, owner: string, origin = window.location.origin) {
  const url = new URL('/verify', origin)
  url.searchParams.set('credential', credentialId)
  url.searchParams.set('owner', owner)
  return url.toString()
}

export function buildContractExplorerUrl(network: string, contractId: string) {
  return `https://stellar.expert/explorer/${encodeURIComponent(network)}/contract/${encodeURIComponent(contractId)}`
}

export function createVerificationReceipt(
  result: CredentialVerificationResponse,
  verifiedAt = new Date().toISOString(),
  origin = window.location.origin,
): VerificationReceipt {
  return {
    receipt_version: 'skillchain-verification-v1',
    verified_at: verifiedAt,
    verification_url: buildVerificationUrl(result.credential_id, result.owner, origin),
    ...result,
  }
}

export function createCredentialPassport(
  credential: CredentialIssueResponse,
  exportedAt = new Date().toISOString(),
  origin = window.location.origin,
): CredentialPassport {
  return {
    passport_version: 'skillchain-passport-v1',
    exported_at: exportedAt,
    verification_url: buildVerificationUrl(credential.credential_id, credential.owner, origin),
    ...credential,
  }
}

export function downloadJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
