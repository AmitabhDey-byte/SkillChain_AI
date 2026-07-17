import type { CredentialIssueResponse } from './api'

export const CREDENTIAL_KEY = 'skillchain.credential.latest'

export function loadCredential(): CredentialIssueResponse | null {
  const saved = localStorage.getItem(CREDENTIAL_KEY)
  if (!saved) return null

  try {
    const credential = JSON.parse(saved) as CredentialIssueResponse
    if (!credential.credential_id || !credential.transaction_hash || !credential.owner) return null
    return credential
  } catch {
    return null
  }
}

export function saveCredential(credential: CredentialIssueResponse) {
  localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(credential))
}

export function clearCredential() {
  localStorage.removeItem(CREDENTIAL_KEY)
}
