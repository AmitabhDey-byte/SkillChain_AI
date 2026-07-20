import { resolveApiBaseUrl } from './apiConfig'

const apiBaseUrl = resolveApiBaseUrl(import.meta.env.PROD, import.meta.env.VITE_API_BASE_URL)
const AUTH_SESSION_KEY = 'skillchain.auth.session'

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

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH'
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

export type AuthSession = {
  access_token: string
  token_type: 'bearer'
  expires_at: string
  wallet_address: string
  network: string
  wallet_type: 'freighter' | 'albedo'
}

export type AuthIdentity = Omit<AuthSession, 'access_token' | 'token_type'>

export function saveAuthSession(session: AuthSession) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function loadAuthSession(): AuthSession | null {
  const value = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!value) return null

  try {
    const session = JSON.parse(value) as AuthSession
    if (!session.access_token || Date.parse(session.expires_at) <= Date.now()) {
      sessionStorage.removeItem(AUTH_SESSION_KEY)
      return null
    }
    return session
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    return null
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let response: Response
  const authSession = loadAuthSession()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (authSession) headers.Authorization = `Bearer ${authSession.access_token}`

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, { error: { code: 'network_error', message: 'Cannot reach the SkillChain API. Make sure the backend is running.' } })
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {}
  if (!response.ok && response.status === 404 && !contentType.includes('application/json')) {
    throw new ApiError(404, {
      error: {
        code: 'api_route_not_found',
        message: 'The SkillChain API route was not deployed. Redeploy and verify /api/v1/health/live.',
      },
    })
  }
  if (!response.ok) throw new ApiError(response.status, payload as ApiErrorPayload)
  return payload as T
}

export function createAuthChallenge(
  walletAddress: string,
  network: string,
  walletType: AuthSession['wallet_type'],
  signal?: AbortSignal,
) {
  return apiRequest<{ challenge_id: string; message: string; expires_at: string }>('/auth/challenge', {
    method: 'POST',
    body: {
      wallet_address: walletAddress,
      network: network.toLowerCase(),
      wallet_type: walletType,
    },
    signal,
  })
}

export function verifyAuthChallenge(
  challengeId: string,
  walletAddress: string,
  signature: string,
  signal?: AbortSignal,
) {
  return apiRequest<AuthSession>('/auth/verify', {
    method: 'POST',
    body: {
      challenge_id: challengeId,
      wallet_address: walletAddress,
      signature,
    },
    signal,
  })
}

export function getAuthIdentity(signal?: AbortSignal) {
  return apiRequest<AuthIdentity>('/auth/me', { signal })
}

export type UserProfile = {
  id: string
  wallet_address: string
  role: 'talent' | 'freelancer' | 'recruiter'
  display_name: string
  headline: string
  location: string | null
  organization: string | null
  bio: string | null
  avatar_url: string | null
  github_username: string | null
  skills: string[]
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export type UserProfileUpsert = {
  role: UserProfile['role']
  display_name: string
  headline: string
  location?: string
  organization?: string
  bio?: string
  avatar_url?: string
  github_username?: string
  skills?: string[]
}

export function getUserProfile(signal?: AbortSignal) {
  return apiRequest<UserProfile>('/users/me', { signal })
}

export function upsertUserProfile(profile: UserProfileUpsert, signal?: AbortSignal) {
  return apiRequest<UserProfile>('/users/me', {
    method: 'PUT',
    body: profile,
    signal,
  })
}

export function getTalentDirectory(signal?: AbortSignal) {
  return apiRequest<{ profiles: UserProfile[]; total: number }>('/marketplace/talent?limit=200', { signal })
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
  return apiRequest<GithubProfile>(`/github/users/${encodeURIComponent(username)}`, { signal })
}

export function getGithubRepositories(username: string, signal?: AbortSignal) {
  return apiRequest<RepositoryList>(`/github/users/${encodeURIComponent(username)}/repositories?per_page=100`, { signal })
}

export type CommitEvidence = {
  sha: string
  message: string
  authored_at: string | null
  additions: number
  deletions: number
  files_changed: number
}

export type RepositoryEvidence = {
  github_repository_id: number
  name: string
  full_name: string
  description: string | null
  repository_url: string
  language: string | null
  languages: Record<string, number>
  topics: string[]
  stars: number
  forks: number
  open_issues: number
  contributors: number
  size_kb: number
  default_branch: string
  license: string | null
  readme_excerpt: string | null
  recent_commits: CommitEvidence[]
  has_tests: boolean
  has_documentation: boolean
  is_fork: boolean
  is_archived: boolean
  pushed_at: string | null
}

export type EvidenceBatchItem = {
  owner: string
  repository: string
  status: string
  evidence: RepositoryEvidence | null
  unavailable_sources: string[]
  error: string | null
}

export type EvidenceBatchResponse = {
  items: EvidenceBatchItem[]
  successful: number
  failed: number
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type DimensionScore = {
  score: number
  rationale: string
  evidence: string[]
}

export type AssessmentDimensions = {
  code_quality: DimensionScore
  architecture: DimensionScore
  documentation: DimensionScore
  consistency: DimensionScore
  complexity: DimensionScore
  impact: DimensionScore
}

export type SkillSignal = {
  name: string
  category: string
  level: SkillLevel
  confidence: number
  evidence: string[]
}

export type RepositoryFinding = {
  repository: string
  complexity_score: number
  technologies: string[]
  strengths: string[]
  improvements: string[]
}

export type SkillAssessment = {
  overall_score: number
  confidence: number
  level: SkillLevel
  summary: string
  dimensions: AssessmentDimensions
  skills: SkillSignal[]
  repository_findings: RepositoryFinding[]
  portfolio_strengths: string[]
  risk_flags: string[]
  next_steps: string[]
  methodology: string
}

export type AssessmentPreviewResponse = {
  model: string
  rubric_version: string
  subject_wallet: string
  github_username: string
  assessment: SkillAssessment
  attestation: string
  usage: {
    prompt_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

export type AssessmentRunResult = AssessmentPreviewResponse & {
  evidence_summary: {
    successful: number
    failed: number
    unavailable_sources: string[]
  }
  repository_ids: number[]
  completed_at: string
}

export function collectGithubEvidence(repositories: GithubRepository[], signal?: AbortSignal) {
  return apiRequest<EvidenceBatchResponse>('/github/evidence', {
    method: 'POST',
    body: {
      repositories: repositories.map((repository) => {
        const [owner, ...nameParts] = repository.full_name.split('/')
        return { owner, repository: nameParts.join('/') }
      }),
    },
    signal,
  })
}

export function previewSkillAssessment(githubUsername: string, repositories: RepositoryEvidence[], signal?: AbortSignal) {
  return apiRequest<AssessmentPreviewResponse>('/assessments/preview', {
    method: 'POST',
    body: { github_username: githubUsername, repositories },
    signal,
  })
}

export type CredentialIssueResponse = {
  credential_id: string
  report_hash: string
  owner: string
  score: number
  level: SkillLevel
  transaction_hash: string
  ledger_sequence: number | null
  contract_id: string
  network: string
}

export type CredentialVerificationResponse = {
  credential_id: string
  owner: string
  active: boolean
  contract_id: string
  network: string
}

export function issueCredential(walletAddress: string, result: AssessmentRunResult, signal?: AbortSignal) {
  return apiRequest<CredentialIssueResponse>('/credentials', {
    method: 'POST',
    body: {
      wallet_address: walletAddress,
      subject_wallet: result.subject_wallet,
      github_username: result.github_username,
      model: result.model,
      rubric_version: result.rubric_version,
      repository_ids: result.repository_ids,
      assessment: result.assessment,
      attestation: result.attestation,
    },
    signal,
  })
}

export function verifyCredential(credentialId: string, owner: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ owner })
  return apiRequest<CredentialVerificationResponse>(
    `/credentials/${encodeURIComponent(credentialId)}/verify?${query.toString()}`,
    { signal },
  )
}

export type LiveHealthResponse = {
  status: 'ok'
  service: string
  version: string
  timestamp: string
}

export type ReadyHealthResponse = {
  status: 'ready' | 'degraded'
  environment: string
  dependencies: {
    database: 'configured' | 'missing'
    gemini: 'configured' | 'pending'
    stellar: 'configured' | 'missing'
  }
}

export function getLiveHealth(signal?: AbortSignal) {
  return apiRequest<LiveHealthResponse>('/health/live', { signal })
}

export function getReadyHealth(signal?: AbortSignal) {
  return apiRequest<ReadyHealthResponse>('/health/ready', { signal })
}

export function recordWalletConnection(walletAddress: string, network: string) {
  return apiRequest<{ accepted: boolean }>('/activity/wallet-connections', {
    method: 'POST',
    body: { wallet_address: walletAddress, network },
  })
}

export type AdminActivityItem = {
  id: string
  wallet_address: string
  interaction_type: string
  network: string
  transaction_hash: string | null
  ledger_sequence: number | null
  success: boolean
  interaction_data: Record<string, unknown>
  created_at: string
}

export type AdminOverviewResponse = {
  unique_wallets: number
  wallet_connections: number
  credentials_issued: number
  credentials_verified: number
  recent_activity: AdminActivityItem[]
  recent_transactions: AdminActivityItem[]
}

export function getAdminOverview(signal?: AbortSignal) {
  return apiRequest<AdminOverviewResponse>('/admin/overview', {
    signal,
  })
}

export type AssistantMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function chatWithAlbedo(message: string, role: string, history: AssistantMessage[], signal?: AbortSignal) {
  return apiRequest<{ reply: string; model: string }>('/assistant/chat', {
    method: 'POST',
    body: { message, role, history: history.slice(-10) },
    signal,
  })
}

export type JobApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'declined'

export type JobApplication = {
  id: string
  job_id: string
  company_id: string
  company_name: string
  job_title: string
  applicant_wallet: string
  applicant_name: string
  applicant_headline: string
  applicant_role: string
  skills: string[]
  message: string
  status: JobApplicationStatus
  created_at: string
  updated_at: string
}

export type JobApplicationCreate = Omit<JobApplication, 'id' | 'status' | 'created_at' | 'updated_at'>

export function submitJobApplication(application: JobApplicationCreate, signal?: AbortSignal) {
  return apiRequest<JobApplication>('/marketplace/applications', {
    method: 'POST',
    body: application,
    signal,
  })
}

export function getJobApplications(companyId?: string, signal?: AbortSignal) {
  const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : ''
  return apiRequest<{ applications: JobApplication[]; total: number }>(`/marketplace/applications${query}`, { signal })
}

export function updateJobApplication(applicationId: string, status: JobApplicationStatus, signal?: AbortSignal) {
  return apiRequest<JobApplication>(`/marketplace/applications/${encodeURIComponent(applicationId)}`, {
    method: 'PATCH',
    body: { status },
    signal,
  })
}
