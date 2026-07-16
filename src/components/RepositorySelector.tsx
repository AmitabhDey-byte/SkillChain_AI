import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  GitFork,
  GitPullRequest,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, getGithubProfile, getGithubRepositories, type GithubProfile, type GithubRepository } from '../lib/api'

type RepositorySelectorProps = {
  username: string
  initialSelection: GithubRepository[]
  onClose: () => void
  onConfirm: (repositories: GithubRepository[]) => void
}

type PortfolioState =
  | { status: 'loading' }
  | { status: 'error'; message: string; requestId?: string }
  | { status: 'success'; profile: GithubProfile; repositories: GithubRepository[]; rateLimitRemaining: number | null }

const maxSelection = 5

function relativeDate(value: string | null) {
  if (!value) return 'No recent push'
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000))
  if (days === 0) return 'Pushed today'
  if (days === 1) return 'Pushed yesterday'
  if (days < 30) return `Pushed ${days} days ago`
  return `Updated ${new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(value))}`
}

export function RepositorySelector({ username, initialSelection, onClose, onConfirm }: RepositorySelectorProps) {
  const [portfolio, setPortfolio] = useState<PortfolioState>({ status: 'loading' })
  const [requestVersion, setRequestVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'original' | 'forks'>('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialSelection.map((repository) => repository.github_repository_id)))
  const [selectionError, setSelectionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([getGithubProfile(username, controller.signal), getGithubRepositories(username, controller.signal)])
      .then(([profile, repositoryList]) => {
        setPortfolio({
          status: 'success',
          profile,
          repositories: repositoryList.repositories,
          rateLimitRemaining: repositoryList.meta.rate_limit_remaining,
        })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        const apiError = error instanceof ApiError ? error : null
        setPortfolio({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to load GitHub repositories.',
          requestId: apiError?.requestId,
        })
      })

    return () => controller.abort()
  }, [username, requestVersion])

  const languages = useMemo(() => {
    if (portfolio.status !== 'success') return []
    return [...new Set(portfolio.repositories.map((repository) => repository.language).filter((language): language is string => Boolean(language)))].sort()
  }, [portfolio])

  const filteredRepositories = useMemo(() => {
    if (portfolio.status !== 'success') return []
    const normalizedQuery = query.trim().toLowerCase()
    return portfolio.repositories.filter((repository) => {
      const matchesQuery = !normalizedQuery || repository.name.toLowerCase().includes(normalizedQuery) || repository.description?.toLowerCase().includes(normalizedQuery) || repository.topics.some((topic) => topic.toLowerCase().includes(normalizedQuery))
      const matchesSource = sourceFilter === 'all' || (sourceFilter === 'forks' ? repository.is_fork : !repository.is_fork)
      const matchesLanguage = languageFilter === 'all' || repository.language === languageFilter
      return matchesQuery && matchesSource && matchesLanguage
    })
  }, [languageFilter, portfolio, query, sourceFilter])

  const selectedRepositories = useMemo(() => {
    if (portfolio.status !== 'success') return initialSelection
    return portfolio.repositories.filter((repository) => selectedIds.has(repository.github_repository_id))
  }, [initialSelection, portfolio, selectedIds])

  const toggleRepository = (repository: GithubRepository) => {
    if (repository.is_archived) return
    const nextIds = new Set(selectedIds)

    if (nextIds.has(repository.github_repository_id)) {
      nextIds.delete(repository.github_repository_id)
    } else if (nextIds.size >= maxSelection) {
      setSelectionError(`Select up to ${maxSelection} repositories for one assessment.`)
      return
    } else {
      nextIds.add(repository.github_repository_id)
    }

    setSelectedIds(nextIds)
    setSelectionError(null)
  }

  const confirmSelection = () => {
    if (selectedRepositories.length === 0) {
      setSelectionError('Select at least one repository to continue.')
      return
    }
    onConfirm(selectedRepositories)
  }

  const retry = () => {
    setPortfolio({ status: 'loading' })
    setRequestVersion((current) => current + 1)
  }

  return (
    <div className="modal-backdrop repository-backdrop" role="presentation">
      <section className="repository-modal" role="dialog" aria-modal="true" aria-labelledby="repository-title">
        <header className="repository-header">
          <button className="repository-back" type="button" onClick={onClose}><ArrowLeft size={16} /> Dashboard</button>
          <div><span>ASSESSMENT SETUP</span><strong>Choose evidence</strong></div>
          <button className="modal-close repository-close" type="button" aria-label="Close repository selector" onClick={onClose}><X size={19} /></button>
        </header>

        {portfolio.status === 'loading' && (
          <div className="repository-state" aria-live="polite"><LoaderCircle className="spin" size={29} /><h2>Syncing your GitHub work</h2><p>Reading public profile and repository metadata for @{username}.</p><div className="repository-skeleton"><span /><span /><span /></div></div>
        )}

        {portfolio.status === 'error' && (
          <div className="repository-state repository-state--error"><span><AlertTriangle size={25} /></span><h2>GitHub sync failed</h2><p>{portfolio.message}</p>{portfolio.requestId && <small>Request ID: {portfolio.requestId}</small>}<button className="button button--primary" type="button" onClick={retry}><RefreshCw size={16} /> Try again</button></div>
        )}

        {portfolio.status === 'success' && (
          <>
            <div className="repository-profile">
              <img src={portfolio.profile.avatar_url} alt="" />
              <div><span>CONNECTED GITHUB PROFILE</span><strong>{portfolio.profile.name || portfolio.profile.username}</strong><small>@{portfolio.profile.username} · {portfolio.profile.public_repositories} public repositories · {portfolio.profile.followers} followers</small></div>
              <a href={portfolio.profile.profile_url} target="_blank" rel="noreferrer">View profile <ExternalLink size={13} /></a>
            </div>

            <div className="repository-toolbar">
              <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories, topics, or skills" /></label>
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)} aria-label="Repository source"><option value="all">All sources</option><option value="original">Original work</option><option value="forks">Forks</option></select>
              <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} aria-label="Programming language"><option value="all">All languages</option>{languages.map((language) => <option value={language} key={language}>{language}</option>)}</select>
            </div>

            <div className="repository-summary"><span><strong>{filteredRepositories.length}</strong> repositories found</span><span><strong>{selectedIds.size}/{maxSelection}</strong> selected</span><span>{portfolio.rateLimitRemaining === null ? 'GitHub API connected' : `${portfolio.rateLimitRemaining} API requests remaining`}</span></div>

            <div className="repository-list">
              {filteredRepositories.length === 0 ? (
                <div className="repository-empty"><Search size={22} /><strong>No matching repositories</strong><span>Try adjusting your search or filters.</span></div>
              ) : filteredRepositories.map((repository) => {
                const selected = selectedIds.has(repository.github_repository_id)
                return (
                  <article className={`${selected ? 'repository-row repository-row--selected' : 'repository-row'}${repository.is_archived ? ' repository-row--disabled' : ''}`} key={repository.github_repository_id}>
                    <button className="repository-check" type="button" aria-label={`${selected ? 'Remove' : 'Select'} ${repository.name}`} onClick={() => toggleRepository(repository)} disabled={repository.is_archived}>{selected && <Check size={14} />}</button>
                    <div className="repository-info">
                      <div><strong>{repository.name}</strong>{repository.is_fork && <span>Fork</span>}{repository.is_archived && <span>Archived</span>}</div>
                      <p>{repository.description || 'No repository description provided.'}</p>
                      <div className="repository-topics">{repository.topics.slice(0, 4).map((topic) => <span key={topic}>{topic}</span>)}</div>
                    </div>
                    <div className="repository-signals">
                      <div>{repository.language && <span><i /> {repository.language}</span>}<span><Star size={13} /> {repository.stars}</span><span><GitFork size={13} /> {repository.forks}</span><span><GitPullRequest size={13} /> {repository.open_issues}</span></div>
                      <small>{relativeDate(repository.pushed_at || repository.updated_at)}</small>
                      <a href={repository.repository_url} target="_blank" rel="noreferrer" aria-label={`Open ${repository.name} on GitHub`}><ExternalLink size={14} /></a>
                    </div>
                  </article>
                )
              })}
            </div>

            <footer className="repository-footer">
              <div><ShieldCheck size={16} /><span>Only public metadata is read. No code is stored during this step.</span></div>
              <div>{selectionError && <span className="repository-selection-error">{selectionError}</span>}<button className="button button--primary" type="button" onClick={confirmSelection}>Review assessment <ArrowRight size={17} /></button></div>
            </footer>
          </>
        )}
      </section>
    </div>
  )
}
