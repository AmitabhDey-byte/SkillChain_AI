# SkillChain AI

AI-powered technical skill verification and portable on-chain credentials on Stellar.

## Current milestone

The application currently includes the React and TypeScript frontend, responsive visual system, public product landing experience, example credential preview, Freighter wallet authentication on Stellar, and a persistent first-time user onboarding flow.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | FastAPI service base URL |
| `VITE_STELLAR_NETWORK` | Stellar network name |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | Stellar network passphrase |

## Wallet authentication

Wallet sign-in uses the official `@stellar/freighter-api` package. The application requests only the user's public address and transaction signatures, validates the active network, warns when the wallet is not on testnet, and stores only a local session preference. Private keys never leave Freighter.

## User onboarding

After wallet authentication, users choose their platform role, create a public professional profile, and link their GitHub identity. The onboarding flow validates each step, saves unfinished drafts locally, clearly explains GitHub analysis consent, and adapts to mobile screens.

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
