# Security Policy

## Reporting

Report suspected vulnerabilities privately to the repository owner through a GitHub Security Advisory. Do not include seed phrases, private keys, production API keys, database credentials, or personal user data in an issue.

Include the affected route or component, reproduction steps, impact, and a minimal proof of concept. Allow reasonable time for investigation before public disclosure.

## Security boundaries

- SkillChain never asks for or stores Stellar seed phrases.
- Wallet authentication signs a non-transaction challenge that cannot move funds.
- Production API access is authorized from the verified wallet session rather than caller-supplied wallet fields.
- Administrator access requires an authenticated wallet in the server-side `ADMIN_WALLETS` allowlist.
- Gemini, GitHub, database, attestation, and Stellar issuer secrets remain server-side.
- AI portfolio evidence is untrusted input and cannot override the assessment system instruction.
- Credentials require a valid server attestation before Soroban issuance.

## Deployment requirements

- Use unique values of at least 32 random characters for `AUTH_SESSION_SECRET` and `CREDENTIAL_ATTESTATION_SECRET`.
- Restrict `CORS_ORIGINS` and `ALLOWED_HOSTS` to deployed domains.
- Keep `STELLAR_ISSUER_SECRET`, `GEMINI_API_KEY`, `GITHUB_TOKEN`, and database credentials out of all `VITE_` variables.
- Rotate a secret immediately if it enters git history, build logs, screenshots, or a client bundle.
- Enable database backups, provider access logs, spend alerts, and production deployment protection.
- Apply migrations before enabling new routes that depend on schema changes.

## Known MVP boundaries

- Stellar contracts use testnet and test assets only.
- Demo marketplace organizations, jobs, and talent are clearly labeled and are not real endorsements.
- The built-in limiter protects a single API instance. A multi-instance deployment should add a shared Redis or provider-level rate limit.
- Public GitHub evidence is analyzed from usernames and repositories; private repository access is not requested.
