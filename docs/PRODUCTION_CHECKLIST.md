# Production Checklist

## Before deployment

- [ ] Run `npm ci`
- [ ] Keep the Vercel Framework Preset set to `Vite`
- [ ] Enable Vercel system environment variables
- [ ] Run `npm run frontend:test`
- [ ] Run `npm run backend:test`
- [ ] Run `npm run contracts:test`
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Confirm `npm audit` reports no known dependency vulnerabilities
- [ ] Deploy the Soroban contract to Stellar testnet
- [ ] Store the deployed contract ID in `STELLAR_CONTRACT_ID`
- [ ] Generate unique production auth and attestation secrets
- [ ] Set exact CORS origins and allowed hosts
- [ ] Add the owner wallet to both admin wallet variables
- [ ] Configure Gemini usage limits and billing alerts

## Database

- [ ] Point `DATABASE_URL` to the production Neon PostgreSQL database
- [ ] Run `npm run backend:migrate`
- [ ] Confirm Alembic head is `20260720_0003`
- [ ] Confirm `auth_challenges`, `users`, `wallet_interactions`, and `job_applications` exist
- [ ] Enable provider backups and retention

## Smoke tests

- [ ] Confirm `/api/v1/health/live` returns HTTP 200 JSON
- [ ] Open the landing page on desktop and mobile
- [ ] Search jobs, companies, and talent on `/explore`
- [ ] Connect Freighter and sign the authentication message
- [ ] Connect Albedo on a mobile browser and sign the authentication message
- [ ] Complete each onboarding role and confirm separate dashboards
- [ ] Sync a public GitHub profile and repository list
- [ ] Run an AI assessment and reopen the saved report
- [ ] Issue a testnet credential and open its Stellar Expert transaction
- [ ] Verify the credential from `/verify`
- [ ] Submit an application and confirm it reaches the recruiter inbox
- [ ] Generate an interview kit and open recruiter analytics
- [ ] Access `/admin` only from the allowlisted owner wallet
- [ ] Confirm unauthorized wallets receive `401` or `403` from protected API routes

## Submission evidence

- [ ] Public GitHub repository with at least 15 meaningful commits
- [ ] Production URL
- [ ] Contract deployment address
- [ ] Product, mobile, and admin monitoring screenshots
- [ ] Demo video link
- [ ] Proof of at least 10 wallet interaction records and transaction IDs
- [ ] User feedback summary
