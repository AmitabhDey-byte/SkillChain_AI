<h1 align="center">SkillChain AI</h1>

<p align="center">
  <strong>AI-powered technical skill verification and portable on-chain credentials on Stellar.</strong>
</p>

<p align="center">
  <a href="https://skill-chain-ai-cona.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="https://stellar.org"><img src="https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar&logoColor=white" alt="Stellar Testnet" /></a>
  <a href="https://github.com/AmitabhDey-byte/SkillChain_AI/actions/workflows/ci-cd.yml"><img src="https://github.com/AmitabhDey-byte/SkillChain_AI/actions/workflows/ci-cd.yml/badge.svg" alt="SkillChain CI" /></a>
  <a href="https://soroban.stellar.org"><img src="https://img.shields.io/badge/Soroban-Smart%20Contracts-yellow" alt="Soroban Smart Contracts" /></a>
</p>

<p align="center">
  <a href="#project-overview">Overview</a> • <a href="#screenshots">Screenshots</a> • <a href="#product-surfaces">Product</a> • <a href="#stellar-credential-contract">Contract</a> • <a href="#local-development">Setup</a>
</p>

---

## Table of Contents

- [Project Overview](#project-overview)
  - [Current Milestone](#current-milestone)
  - [Deployment & Contract](#deployment--contract)
- [Screenshots](#screenshots)
- [Demo Video Link](#demo-video-link)
- [The Users Logged In and Used](#the-users-logged-in-and-used)
- [User Feedback](#user-feedback)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Backend Foundation](#backend-foundation)
- [Database](#database)
- [Continuous Integration](#continuous-integration)
- [Vercel Deployment](#vercel-deployment)
- [Product Surfaces](#product-surfaces)
- [Marketplace](#marketplace)
- [Albedo Assistant](#albedo-assistant)
- [GitHub Integration](#github-integration)
- [AI Assessment](#ai-assessment)
- [Wallet Authentication](#wallet-authentication)
- [Stellar Credential Contract](#stellar-credential-contract)
- [User Onboarding](#user-onboarding)
- [User Dashboard](#user-dashboard)
- [Security Controls](#security-controls)
- [Cost Controls](#cost-controls)

---

## Project Overview

### Current milestone

The application includes role-specific React workspaces, signed Freighter and Albedo wallet sessions, GitHub evidence analysis, Gemini skill assessment, Stellar credentials, a searchable opportunity graph, PostgreSQL-backed profiles and applications, hiring intelligence, and the Albedo blockchain assistant.

### Deployment & Contract

| Resource | Value |
| --- | --- |
| Contract Deployment Address | `CCC5TSRN6WGWE4WPIQTW7NSEXDX3NRW63XW74PDLPRLJXDSJUJGDHSJV` |
| Deployed URL | [https://skill-chain-ai-cona.vercel.app/](https://skill-chain-ai-cona.vercel.app/) |

---

## Screenshots

### Product UI

<img width="1917" height="862" alt="Screenshot 2026-07-21 103917" src="https://github.com/user-attachments/assets/6b0cd245-0aa6-41c4-b045-4897dab69148" />
<img width="1915" height="967" alt="Screenshot 2026-07-21 103850" src="https://github.com/user-attachments/assets/2f567b4a-57eb-4663-b6e7-4ebdbbab704c" />
<img width="1917" height="867" alt="Screenshot 2026-07-21 103830" src="https://github.com/user-attachments/assets/7d0b74e7-436d-45e4-a668-691361badd00" />
<img width="1917" height="867" alt="Screenshot 2026-07-21 103807" src="https://github.com/user-attachments/assets/d6084bb0-15d1-49a6-81b8-87790f9c98f1" />

### Mobile Responsive Design
<img width="360" height="800" alt="WhatsApp Image 2026-07-21 at 3 18 34 PM (1)" src="https://github.com/user-attachments/assets/84d8ce5c-66f8-428a-8950-000b4c5e3520" />
<img width="360" height="800" alt="WhatsApp Image 2026-07-21 at 3 18 34 PM" src="https://github.com/user-attachments/assets/50af13d3-80a2-4f25-bab1-5a5f7dcee884" />
<img width="360" height="800" alt="WhatsApp Image 2026-07-21 at 3 18 33 PM" src="https://github.com/user-attachments/assets/7cdeb23f-50d8-45a0-ae10-4dce0c16d58c" />

### Admin Panel


<img width="1915" height="966" alt="image" src="https://github.com/user-attachments/assets/b160d706-41be-41f5-9da7-f1c4bd51c79c" />

### 📊 User Onboarding Data

The following consent-based onboarding records demonstrate real Stellar wallet connections and early product feedback. Contact details are intentionally excluded from this public repository.

| Joined (IST) | Participant | Stellar Testnet Wallet | Product Feedback |
| --- | --- | --- | --- |
| 18 Jul 2026, 22:41 | Debansh Tiwari | `GA4SXARZZ4RPF6N7VOAH3B5OKMFAP3FGY6M6TO3DZJL4TMU2KOVBHCIY` | The overall experience is smooth. Liked the product! |
| 18 Jul 2026, 22:46 | Souvik Mandal | `GDDO6MEIVRZTXCJWLPPQAKTIWTD6CLOTGLJBQY63KMOIYASKXNU6WXN5` | Liked the idea and UI/UX; requested a walkthrough or user guide. |
| 18 Jul 2026, 22:46 | Ansh Raj | `GA3EHDIPTPLQTQESCNR4TSJYBSERD57KERCNFHGWEJ5OX2XSWTMJO424` | It is really good. |
| 19 Jul 2026, 13:19 | pritam dev | `GATJMD6BGNK4FQYNFWB354N7RP4XHA2R74GNSYM472ALNLJFX7NXBS3X` | Awesome product. |
| 20 Jul 2026, 00:27 | Lohit Mishra | `GDYWYDOBPPM2XFQS2N7OA2XYO66C24OSBDGASSYAU7V3V4UHFIQYWCRL` | UI is great; reported opportunity-server errors. |
| 20 Jul 2026, 17:46 | Sk Jishan Uddin | `GAVVOOVYGE7QEJWQO2BZZBGYYSFQPBC3QAYWRC6AFP7E3UMCWFT6YC4U` | Very user-friendly; unlike any website they had seen. |
| 21 Jul 2026, 12:52 | Ritesh Gupta | `GDFSDPEEBZYQVG5JPPTJUOH4FID4M5XV45BKTWCIEIRYMCWJ6DQADBMB` | Yup. |
| 21 Jul 2026, 13:16 | Priyanka Mondal | `GCKMODNZEAI4X6AL6SL77PNJLUUJAQAWECXDTXJZGXBOSSSF7THC3XH6` | Better product than others in the market. |
| 21 Jul 2026, 13:17 | Ritam Saha | `GACMLTEWZ23NGJ5WZ2THYGLODFYTEKECB7J2U33H3DCSW2PEAQUEIZED` | Good. |
| 21 Jul 2026, 15:17 | Elijah Negasi | `GAXCXDDP44VRDTL2PJI22WJU6H4CMRMI2CHRJGPJ3S3L4R323ETDOCAL` | Amazing! |
| 21 Jul 2026, 16:17 | Rishikesh Singh | `GCO222KICSTS24BWPBEOSYQG5L3RAN4KHII7CE2CW36HRHRXQQPC6OCB` | Liked the UI and credential hashing. |
| 21 Jul 2026, 16:25 | Nitin Raj | `GARRE4DTEUJIQSXRACCL6X55RH42S7WBO32F5HB4DU32MT6IL5TL3B3N` | Clean UI, smooth workflow, and promising AI-assisted learning platform. |
| 21 Jul 2026, 17:30 | Sadiya Mulani | `GBTCGV43NLHEEBMCA5DWFZT6GOJYYCPHXNOEALTBQ7TREIQKQQAVLYT4` | AI-verified, wallet-owned credentials solve a real trust problem. |
| 21 Jul 2026, 18:54 | Ankush Shaw | `GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI` | Liked the clean, simple UI. |
| 21 Jul 2026, 20:06 | Subhadip Dutta | `GAVNLCS3GSWLKXSLZ3ITSL7QNB5IGHEOELXAF6QTYACDLEJ7XRQKBBNO` | Very nice UI and innovative idea. |
| 21 Jul 2026, 22:13 | Arya Bhagat | `GCNZDOHRGJLUKX53TR5PETCO7Q3BKKWVS5K5GQ3NPFZYQ4MKY2BK6A32` | A good project to start with. |
| 21 Jul 2026, 23:05 | Aditya Jha | `GAG3SUKHIF7VAWGTDRH52XETMLZXXNXBAZLLXHSLXAQPOBBCN43YLKR4` | Liked the product; suggested more UI polish. |
| 23 Jul 2026, 00:05 | Sandipan Singh | `GDYIHXTUKLCPZHWGGD5B5ZPJZINZ3WUNC3PJCDAYEB4XY4LT2XNTQHTX` | Pretty good—keep scaling it. |
| 23 Jul 2026, 13:06 | ankita barman | `GCV5X5CKYUAPQLE3OYQS3PDXKX4TRV767YUCJ66PWWGZD2BXE744T276` | Good. |

For the User Validation form: https://docs.google.com/forms/d/e/1FAIpQLSc2hSXyNt_CCiMmWwtXP9lqwrRi4rpVwewcMvleGUFOyDLtFQ/viewform?usp=header

For the original evidence record, see the [wallet-interaction spreadsheet](https://docs.google.com/spreadsheets/d/1oUoptldG3q2xLOB6MRCxIvKnnaoslLS-xJvDXYy84ZE/edit?usp=sharing).


### CI/CD Pipeline


<img width="1917" height="872" alt="image" src="https://github.com/user-attachments/assets/4631e5b5-912c-46d6-bf89-c258f34f0a8e" />


## Demo Video Link

https://drive.google.com/file/d/1vRIymJ3lND-0kHgibKv5hUBLFTyZ75OR/view?usp=sharing

## The Users Logged In and Used

[Open the wallet-interaction spreadsheet](https://docs.google.com/spreadsheets/d/1oUoptldG3q2xLOB6MRCxIvKnnaoslLS-xJvDXYy84ZE/edit?usp=sharing)

---

## User Feedback

Signed wallet users can submit a 1–5 rating, topic, message, and page context through the workspace feedback card. Administrators can review submitted feedback and the wallet-interaction spreadsheet from the protected operations dashboard.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/feedback` | Submit signed wallet feedback |
| `GET /api/v1/admin/feedback` | Read submitted feedback as an authorized administrator |
| `GET /api/v1/admin/users` | Read completed user profiles as an authorized administrator |

---

## Local Development

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

Local development uses `/api/v1` through the Vite proxy when `VITE_API_BASE_URL` is empty. A configured local API URL such as `http://localhost:8000/api/v1` is also supported. Production always uses same-origin `/api/v1`. The Windows development command runs Uvicorn without multiprocessing reload mode for compatibility with Python 3.14.

---

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Optional local API URL; production uses same-origin `/api/v1` |
| `VITE_STELLAR_NETWORK` | Stellar network name |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | Stellar network passphrase |
| `VITE_ADMIN_WALLETS` | Comma-separated admin wallets used for frontend route visibility |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SESSION_SECRET` | At least 32 random characters used to sign wallet sessions |
| `AUTH_TOKEN_MINUTES` | Signed wallet session lifetime |
| `AUTH_CHALLENGE_MINUTES` | One-time wallet challenge lifetime |
| `ADMIN_WALLETS` | JSON array of production administrator wallet addresses |
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
| `ALLOWED_HOSTS` | JSON array of exact production hosts accepted by FastAPI |
| `MAX_REQUEST_BODY_BYTES` | Maximum request body size |

---

## Backend Foundation

The FastAPI service uses typed environment configuration, explicit CORS policy, request correlation IDs, processing-time headers, centralized safe error responses, production-aware API documentation, liveness and readiness probes, and an application factory for isolated testing.

```bash
npm run backend:test
```

---

## Database

PostgreSQL persistence uses SQLAlchemy 2 with async sessions and Alembic migrations. The schema stores wallet-owned users, GitHub identities, wallet interaction proof, feedback, and cross-device marketplace applications. Models use UUID primary keys, stable enum values, indexed lookup paths, timestamps, and database constraints.

```bash
npm run backend:migrate
```

Run the migration command manually before each production deployment, including migration `20260721_0004` for persistent application notifications.

---

## Continuous Integration

GitHub Actions runs frontend tests, ESLint, a production frontend build, backend tests, Alembic migration graph validation, and Soroban contract tests for pull requests and pushes to `master` or `main`. The workflow does not deploy, access Vercel, apply database migrations, or require repository secrets.

Deployments remain manual through the Vercel dashboard after the CI checks pass.

---

## Vercel Deployment

The repository deploys the Vite frontend and complete FastAPI backend as two Vercel Services in one project. `vercel.json` routes `/api/*` to `backend/main.py` and all product routes to the Vite frontend.

Set the Framework Preset to `Services`, keep the Root Directory at the repository root, leave the Build Command, Output Directory, and Install Command overrides empty, and keep Vercel system environment variables enabled. Each service is detected and built from `vercel.json`. Add these Production and Preview variables:

| Variable | Value |
| --- | --- |
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | Neon pooled PostgreSQL URL |
| `AUTH_SESSION_SECRET` | Unique random value with at least 32 characters |
| `CORS_ORIGINS` | `["https://skill-chain-ai-cona.vercel.app"]` |
| `ALLOWED_HOSTS` | `["skill-chain-ai-cona.vercel.app"]` |
| `ADMIN_WALLETS` | JSON array containing the owner Stellar wallet |
| `GEMINI_API_KEY` | Server-only Gemini key |
| `GEMINI_API_VERSION` | `v1` |
| `GITHUB_TOKEN` | Optional server-only GitHub token |
| `STELLAR_CONTRACT_ID` | Deployed Soroban credential contract ID |
| `STELLAR_ISSUER_SECRET` | Server-only Stellar testnet issuer secret |
| `CREDENTIAL_ATTESTATION_SECRET` | Unique random value with at least 32 characters |
| `VITE_STELLAR_NETWORK` | `testnet` |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` |
| `VITE_ADMIN_WALLETS` | Comma-separated owner wallet addresses |

Delete `VITE_API_BASE_URL` from Vercel because production uses the same deployment origin. After redeploying, verify:

```text
https://skill-chain-ai-cona.vercel.app/api/v1/health/live
https://skill-chain-ai-cona.vercel.app/api/v1/health/ready
```

---

## Product Surfaces

- `/` presents the three-dimensional SkillChain Proof OS experience.
- `/explore` searches 50 clearly marked demo roles, companies, and talent profiles.
- `/trust` exposes live service readiness and the platform security model.
- `/dashboard` provides skill graphs, opportunities, assessments, credentials, career copilot, verification, public profile, and settings for developers and freelancers.
- `/recruiter-dashboard` provides talent discovery, applications, interview studio, analytics, credential verification, and review history.
- `/admin` is available only to signed wallets present in both `VITE_ADMIN_WALLETS` and the server-side `ADMIN_WALLETS` allowlist.

## Marketplace

Talent accounts can search 50 distinct demonstration companies and vacancies, filter by work mode or engagement, save opportunities, and submit wallet-linked application requests. Recruiters receive those requests in a persistent inbox and can move them through pending, reviewing, shortlisted, and declined states.

Recruiters can search registered developer and freelancer accounts together with 50 clearly marked demonstration profiles. Live database members appear first and are searchable by name, GitHub username, headline, role, location, and saved skills. The universal dashboard search consumes the same live directory.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/marketplace/talent` | List registered developer and freelancer profiles |
| `POST /api/v1/marketplace/applications` | Submit a job application |
| `GET /api/v1/marketplace/applications` | Read recruiter application requests |
| `PATCH /api/v1/marketplace/applications/{id}` | Update recruiter review status |

---

## Albedo Assistant

Albedo is available throughout the product. Anonymous visitors receive a curated local blockchain guide that makes no model request. Authenticated users can use the Gemini-powered assistant for role-aware guidance. Server-side guardrails reject secret-recovery requests and the API applies authenticated access and route-specific throttling.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/assistant/chat` | Send a bounded conversation to Albedo |

---

## GitHub Integration

The backend consumes GitHub REST API version `2026-03-10` through a typed server-side client. Public profile and repository endpoints include bounded pagination, normalized response models, rate-limit metadata, timeouts, connection failure handling, and safe upstream errors. An optional server token increases GitHub API limits without exposing credentials to the browser.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/github/users/{username}` | Fetch a normalized public profile |
| `GET /api/v1/github/users/{username}/repositories` | List owned public repositories |
| `GET /api/v1/github/repos/{owner}/{repository}/evidence` | Collect analysis-ready repository evidence |
| `POST /api/v1/github/evidence` | Collect evidence for up to five repositories |

The dashboard repository picker consumes these endpoints directly. It includes profile sync, repository search, source and language filters, loading skeletons, retryable failures, archived-repository safeguards, a five-repository assessment limit, GitHub rate-limit visibility, and persistent local assessment drafts.

Assessment evidence combines normalized language percentages, an 8,000-character README excerpt, twenty recent commits, contributor counts, repository metadata, and file-tree signals for tests and documentation. Batch collection limits concurrency and returns successful repositories even when another selected repository or optional evidence source fails.

---

## AI Assessment

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

---

## Wallet Authentication

Freighter sign-in uses the official `@stellar/freighter-api` package and Albedo uses `@albedo-link/intent`. The API creates a short-lived, one-time challenge containing the wallet, network, nonce, issue time, and expiry. The wallet signs that exact message and the server verifies its Ed25519 signature before issuing a bounded bearer session. Sessions are stored in browser session storage and disappear when the tab session ends. Private keys never reach SkillChain.

Protected production routes bind credential issuance, AI assessment, GitHub evidence collection, marketplace applications, user profiles, and admin operations to the signed wallet identity.

---

## Stellar Credential Contract

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

---

## User Onboarding

After wallet authentication, users choose their platform role, create a public professional profile, and link their GitHub identity. Completed profiles are persisted to PostgreSQL and restored by wallet address across devices. Unfinished drafts remain local, GitHub analysis requires explicit consent, and GitHub avatars appear automatically when available.

---

## User Dashboard

Completed onboarding routes users into a responsive workspace with trust readiness, evidence sources, assessment status, a visual skill graph, career copilot, opportunity search, credential progress, connected wallet details, public profile data, and recent activity. Recruiters receive a separate hiring command center rather than the talent dashboard.

Secrets such as the Gemini API key will live only in the backend environment and must never use the `VITE_` prefix or be committed to source control.

---

## Security Controls

- Signed one-time Freighter and Albedo authentication challenges
- Wallet-bound resource authorization and recruiter role checks
- Wallet allowlisted production administration without browser-stored admin keys
- Explicit CORS and trusted host allowlists
- Route-sensitive rate limits with bounded in-memory buckets
- Request body limits for declared and streamed payloads
- CSP, clickjacking, MIME-sniffing, referrer, permissions, and no-store headers
- Strict Gemini schemas, prompt-injection boundaries, timeouts, and bounded retries
- Signed assessment attestations before credential issuance
- Server-only Gemini, GitHub, Stellar issuer, and attestation secrets

See `SECURITY.md` for reporting guidance and `docs/PRODUCTION_CHECKLIST.md` for deployment verification.

---

## Cost Controls

The redesign uses local CSS, an included generated image asset, Lucide icons, and open-source wallet SDKs. It does not require a paid design plugin or third-party analytics subscription. Anonymous Albedo answers are local. Gemini usage occurs only for authenticated assistant requests and explicit portfolio assessments, so configure a Google AI usage limit and alert before production.
