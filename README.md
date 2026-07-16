# SkillChain AI

AI-powered technical skill verification and portable on-chain credentials on Stellar.

## Current milestone

The first development milestone establishes the React and TypeScript frontend, responsive visual system, public product landing experience, and example credential preview.

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

