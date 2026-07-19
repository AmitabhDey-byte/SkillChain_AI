# SkillChain AI

AI-powered technical skill verification and portable on-chain credentials on Stellar.

## Current milestone

The application includes role-specific React dashboards, Freighter wallet authentication, GitHub evidence analysis, Gemini skill assessment, Stellar credentials, a searchable jobs and talent marketplace, PostgreSQL-backed applications, and the Gemini-powered Albedo blockchain assistant.

## Local development

```bash
npm install
python -m pip install -e "backend[dev]"
cp .env.example .env
npm run dev
```

The combined development command starts the frontend at `http://localhost:5173` and the API at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs` outside production.

Store real credentials only in the ignored `.env` file. `.env.example` documents required variable names and must never contain API keys or signing secrets.

To run either service separately:

```bash
npm run frontend:dev
npm run backend:dev
```

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
| `STELLAR_RPC_URL` | Stellar RPC endpoint |
| `STELLAR_CONTRACT_ID` | Deployed credential contract address |
| `STELLAR_ISSUER_SECRET` | Server-only issuer signing key |
| `CREDENTIAL_ATTESTATION_SECRET` | Server-only HMAC key protecting AI reports |

## Backend foundation

The FastAPI service uses typed environment configuration, explicit CORS policy, request correlation IDs, processing-time headers, centralized safe error responses, production-aware API documentation, liveness and readiness probes, and an application factory for isolated testing.

```bash
npm run backend:test
```

## Database

PostgreSQL persistence uses SQLAlchemy 2 with async sessions and Alembic migrations. The schema stores wallet-owned users, GitHub identities, wallet interaction proof, feedback, and cross-device marketplace applications. Models use UUID primary keys, stable enum values, indexed lookup paths, timestamps, and database constraints.

```bash
npm run backend:migrate
```

Run the migration command against the production `DATABASE_URL` after every deployment containing a new migration. The `20260719_0002` migration creates the recruiter application inbox.

## Marketplace

Talent accounts can search 50 distinct demonstration companies and vacancies, filter by work mode or engagement, save opportunities, and submit wallet-linked application requests. Recruiters receive those requests in a persistent inbox and can move them through pending, reviewing, shortlisted, and declined states.

Recruiters can also search 50 developer and freelancer profiles by skill, role, location, availability, and AI skill score. The universal dashboard search adapts its result priority to the current account role.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/marketplace/applications` | Submit a job application |
| `GET /api/v1/marketplace/applications` | Read recruiter application requests |
| `PATCH /api/v1/marketplace/applications/{id}` | Update recruiter review status |

## Albedo assistant

Albedo is a floating Gemini-powered assistant available throughout the product. It answers practical questions about Stellar, Soroban, wallets, credentials, blockchain careers, and SkillChain workflows. Server-side guardrails prevent requests for secrets and clearly separate testnet assets from real funds.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/assistant/chat` | Send a bounded conversation to Albedo |

## GitHub integration

The backend consumes GitHub REST API version `2026-03-10` through a typed server-side client. Public profile and repository endpoints include bounded pagination, normalized response models, rate-limit metadata, timeouts, connection failure handling, and safe upstream errors. An optional server token increases GitHub API limits without exposing credentials to the browser.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/github/users/{username}` | Fetch a normalized public profile |
| `GET /api/v1/github/users/{username}/repositories` | List owned public repositories |
| `GET /api/v1/github/repos/{owner}/{repository}/evidence` | Collect analysis-ready repository evidence |
| `POST /api/v1/github/evidence` | Collect evidence for up to five repositories |

The dashboard repository picker consumes these endpoints directly. It includes profile sync, repository search, source and language filters, loading skeletons, retryable failures, archived-repository safeguards, a five-repository assessment limit, GitHub rate-limit visibility, and persistent local assessment drafts.

Assessment evidence combines normalized language percentages, an 8,000-character README excerpt, twenty recent commits, contributor counts, repository metadata, and file-tree signals for tests and documentation. Batch collection limits concurrency and returns successful repositories even when another selected repository or optional evidence source fails.

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

The frontend now runs the complete assessment pipeline from the dashboard. It collects evidence for the selected repositories, submits successful evidence to Gemini, displays distinct collection and analysis phases, supports safe retries, persists the validated report locally, and lets returning users reopen results without triggering another model request. Reports expose dimension rationales, cited evidence, skill confidence, repository findings, strengths, limitations, recommendations, methodology, and model usage.

## Wallet authentication

Wallet sign-in uses the official `@stellar/freighter-api` package. The application requests only the user's public address and transaction signatures, validates the active network, warns when the wallet is not on testnet, and stores only a local session preference. Private keys never leave Freighter.

## Stellar credential contract

The Soroban credential contract implements issuer-authenticated credential creation, wallet ownership verification, typed skill levels, report hash anchoring, revocation, typed events, and automatic storage TTL renewal. Five unit tests cover initialization, issuance, validation, duplicate prevention, ownership checks, and revocation.

```bash
npm run contracts:test
npm run contracts:build
```

The optimized contract artifact is ready for Stellar testnet deployment. Deployment and interface instructions are available in `contracts/README.md`.

The backend exposes production issuance and verification boundaries:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/credentials` | Validate the signed AI report and issue its wallet-owned credential |
| `GET /api/v1/credentials/{credential_id}/verify` | Verify credential ownership and active status against Stellar |

Assessment responses include a server-generated HMAC attestation. Issuance rejects modified scores or reports before preparing a Stellar transaction. The issuer secret remains server-only, and public verification uses a read-only contract simulation.

Completed reports now continue into a responsive issuance experience with transaction progress, safe retry errors, persisted credential details, Stellar Expert links, and copyable credential IDs. Recruiters can verify a credential without connecting a wallet or creating an account at `/verify`.

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
5. Connect credential issuance to the deployed Soroban contract
6. Public credential verification portal
7. Recruiter dashboard and milestone payments
8. Analytics, monitoring, testing, and deployment
