export const ONBOARDING_DRAFT_KEY = 'skillchain.onboarding.draft'
export const ONBOARDING_COMPLETE_KEY = 'skillchain.onboarding.complete'

export type UserRole = 'talent' | 'freelancer' | 'recruiter'

export type OnboardingProfile = {
  role: UserRole | null
  displayName: string
  headline: string
  location: string
  organization: string
  githubUsername: string
  githubConsent: boolean
}

export const emptyOnboardingProfile: OnboardingProfile = {
  role: null,
  displayName: '',
  headline: '',
  location: '',
  organization: '',
  githubUsername: '',
  githubConsent: false,
}

export function loadOnboardingDraft() {
  const savedDraft = localStorage.getItem(ONBOARDING_DRAFT_KEY)
  if (!savedDraft) return emptyOnboardingProfile

  try {
    return { ...emptyOnboardingProfile, ...JSON.parse(savedDraft) } as OnboardingProfile
  } catch {
    return emptyOnboardingProfile
  }
}

export function hasCompletedOnboarding() {
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true'
}

export function saveOnboardingDraft(profile: OnboardingProfile) {
  localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(profile))
}

export function completeOnboarding(profile: OnboardingProfile) {
  localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(profile))
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
}
