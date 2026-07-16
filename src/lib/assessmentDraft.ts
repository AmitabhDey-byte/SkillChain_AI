import type { GithubRepository } from './api'

export const ASSESSMENT_REPOSITORIES_KEY = 'skillchain.assessment.repositories'

export function loadAssessmentRepositories(): GithubRepository[] {
  const saved = localStorage.getItem(ASSESSMENT_REPOSITORIES_KEY)
  if (!saved) return []

  try {
    const repositories = JSON.parse(saved)
    return Array.isArray(repositories) ? repositories : []
  } catch {
    return []
  }
}

export function saveAssessmentRepositories(repositories: GithubRepository[]) {
  localStorage.setItem(ASSESSMENT_REPOSITORIES_KEY, JSON.stringify(repositories))
}

