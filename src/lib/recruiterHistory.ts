import type { CredentialVerificationResponse } from './api'

export type VerificationHistoryItem = CredentialVerificationResponse & {
  verified_at: string
}

export const RECRUITER_HISTORY_KEY = 'skillchain.recruiter.verificationHistory'

export function loadRecruiterHistory(): VerificationHistoryItem[] {
  const saved = localStorage.getItem(RECRUITER_HISTORY_KEY)
  if (!saved) return []

  try {
    const history = JSON.parse(saved) as VerificationHistoryItem[]
    return Array.isArray(history) ? history.slice(0, 10) : []
  } catch {
    return []
  }
}

export function recordRecruiterVerification(result: CredentialVerificationResponse) {
  const nextItem = { ...result, verified_at: new Date().toISOString() }
  const history = loadRecruiterHistory()
  const nextHistory = [nextItem, ...history.filter((item) => item.credential_id !== result.credential_id)].slice(0, 10)
  localStorage.setItem(RECRUITER_HISTORY_KEY, JSON.stringify(nextHistory))
  return nextHistory
}

export function clearRecruiterHistory() {
  localStorage.removeItem(RECRUITER_HISTORY_KEY)
}
