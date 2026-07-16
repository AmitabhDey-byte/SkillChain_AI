const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

type ApiErrorPayload = {
  error?: {
    code?: string
    message?: string
    request_id?: string
    details?: unknown
  }
}

export class ApiError extends Error {
  status: number
  code: string
  requestId?: string
  details?: unknown

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.error?.message || 'The service could not complete this request.')
    this.name = 'ApiError'
    this.status = status
    this.code = payload.error?.code || 'request_failed'
    this.requestId = payload.error?.request_id
    this.details = payload.error?.details
  }
}

async function apiRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, { error: { code: 'network_error', message: 'Cannot reach the SkillChain API. Make sure the backend is running.' } })
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, payload as ApiErrorPayload)
  return payload as T
}

export type GithubProfile = {
  github_user_id: number
  username: string
  name: string | null
  bio: string | null
  avatar_url: string
  profile_url: string
  company: string | null
  location: string | null
  blog: string | null
  followers: number
  following: number
  public_repositories: number
  created_at: string | null
  updated_at: string | null
}

export type GithubRepository = {
  github_repository_id: number
  name: string
  full_name: string
  description: string | null
  repository_url: string
  homepage: string | null
  language: string | null
  topics: string[]
  stars: number
  forks: number
  open_issues: number
  size_kb: number
  default_branch: string
  is_fork: boolean
  is_archived: boolean
  visibility: string
  license: string | null
  updated_at: string | null
  pushed_at: string | null
}

export type RepositoryList = {
  repositories: GithubRepository[]
  meta: {
    page: number
    per_page: number
    returned: number
    has_next: boolean
    rate_limit_remaining: number | null
    rate_limit_reset: number | null
  }
}

export function getGithubProfile(username: string, signal?: AbortSignal) {
  return apiRequest<GithubProfile>(`/github/users/${encodeURIComponent(username)}`, signal)
}

export function getGithubRepositories(username: string, signal?: AbortSignal) {
  return apiRequest<RepositoryList>(`/github/users/${encodeURIComponent(username)}/repositories?per_page=100`, signal)
}

