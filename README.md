# SkillChain AI

AI-powered technical skill verification and portable on-chain credentials on Stellar.

## Current milestone

The application currently includes the React and TypeScript frontend, responsive visual system, public product landing experience, example credential preview, Freighter wallet authentication on Stellar, persistent first-time onboarding, and an authenticated user workspace.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

Start the API in a second terminal:

```bash
python -m pip install -e "backend[dev]"
npm run backend:dev
```

The API runs at `http://localhost:8000`, with interactive documentation available at `http://localhost:8000/docs` outside production.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | FastAPI service base URL |
| `VITE_STELLAR_NETWORK` | Stellar network name |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | Stellar network passphrase |
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Server-only Gemini credential |
| `GEMINI_MODEL` | Gemini model used for assessments |
| `CORS_ORIGINS` | JSON array of permitted frontend origins |
| `GITHUB_CLIENT_ID` | GitHub OAuth application identifier |
| `GITHUB_CLIENT_SECRET` | Server-only GitHub OAuth secret |
| `GITHUB_TOKEN` | Optional server token for higher public API limits |
| `GITHUB_API_VERSION` | Pinned GitHub REST API version |
| `STELLAR_RPC_URL` | Soroban JSON-RPC endpoint |
| `STELLAR_CONTRACT_ID` | Deployed SkillChain contract identifier |

## Backend foundation

The FastAPI service uses typed environment configuration, explicit CORS policy, request correlation IDs, processing-time headers, centralized safe error responses, production-aware API documentation, liveness and readiness probes, and an application factory for isolated testing.

```bash
npm run backend:test
```

## Database

PostgreSQL persistence uses SQLAlchemy 2 with async sessions and Alembic migrations. The core schema stores wallet-owned users, GitHub identities, wallet interaction proof, and structured user feedback. Models use UUID primary keys, explicit foreign-key deletion behavior, stable enum values, indexed lookup paths, timestamps, and database constraints.

```bash
npm run backend:migrate
```

## GitHub integration

The backend consumes GitHub REST API version `2026-03-10` through a typed server-side client. Public profile and repository endpoints include bounded pagination, normalized response models, rate-limit metadata, timeouts, connection failure handling, and safe upstream errors. An optional server token increases GitHub API limits without exposing credentials to the browser.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/github/users/{username}` | Fetch a normalized public profile |
| `GET /api/v1/github/users/{username}/repositories` | List owned public repositories |

The dashboard repository picker consumes these endpoints directly. It includes profile sync, repository search, source and language filters, loading skeletons, retryable failures, archived-repository safeguards, a five-repository assessment limit, GitHub rate-limit visibility, and persistent local assessment drafts.

## AI assessment

`POST /api/v1/assessments/preview` submits bounded repository evidence to Gemini using a strict structured-output schema. The server applies prompt-injection protections, validates every response, retries transient failures, handles safety blocks, records token usage, and recomputes the final score and level from a transparent rubric.

| Dimension | Weight |
| --- | ---: |
| Code quality | 25% |
| Architecture | 20% |
| Documentation | 15% |
| Consistency | 15% |
| Complexity | 15% |
| Impact | 10% |

## Wallet authentication

Wallet sign-in uses the official `@stellar/freighter-api` package. The application requests only the user's public address and transaction signatures, validates the active network, warns when the wallet is not on testnet, and stores only a local session preference. Private keys never leave Freighter.

## User onboarding

After wallet authentication, users choose their platform role, create a public professional profile, and link their GitHub identity. The onboarding flow validates each step, saves unfinished drafts locally, clearly explains GitHub analysis consent, and adapts to mobile screens.

## User dashboard

Completed onboarding routes users into a responsive workspace that shows trust readiness, evidence sources, assessment status, credential progress, connected wallet details, public profile data, and recent account activity. Returning users can resume directly from the landing page.

Secrets such as the Gemini API key will live only in the backend environment and must never use the `VITE_` prefix or be committed to source control.

## Planned architecture

- **Frontend:** React, TypeScript, Vite
- **Backend:** FastAPI, PostgreSQL, Gemini API
- **Blockchain:** Stellar testnet, Soroban contracts
- **Integrations:** GitHub OAuth, Stellar wallet providers

## Roadmap

1. Product shell and responsive visual system
2. Wallet authentication and onboarding
3. GitHub connection and repository selection
4. AI assessment workflow and reports
5. Soroban credential contract and issuance
6. Public credential verification portal
7. Recruiter dashboard and milestone payments
8. Analytics, monitoring, testing, and deployment
