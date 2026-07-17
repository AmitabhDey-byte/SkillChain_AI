# SkillChain Credential Contract

The credential contract stores AI skill verification results on Stellar while keeping the full assessment report off-chain. Each record contains a deterministic 32-byte credential ID, wallet owner, score, skill level, report hash, issuance time, and revocation state.

## Security model

- Only the initialized issuer can create or revoke credentials.
- Issuance requires a unique credential ID and a score from 0 to 100.
- Evidence is represented by a 32-byte report hash so assessment details remain private and independently verifiable.
- Ownership verification is public and returns false for missing, mismatched, or revoked credentials.
- Instance and persistent storage TTL values are renewed during contract activity.
- Issuance and revocation emit typed contract events for indexers and monitoring.

## Local validation

```bash
npm run contracts:test
npm run contracts:build
```

The optimized artifact is generated at `contracts/target/wasm32v1-none/release/skillchain_credential.wasm`.

## Testnet deployment

Create and fund a Stellar CLI identity before deployment:

```powershell
stellar keys generate skillchain-deployer --network testnet --fund
npm run contracts:deploy:testnet -- -Source skillchain-deployer
```

The deployment command builds the optimized Wasm, deploys it to Stellar testnet, initializes the issuer, saves the local contract alias `skillchain-credential-testnet`, and prints values for `STELLAR_CONTRACT_ID` and `STELLAR_ISSUER_ADDRESS`.

## Contract interface

| Function | Access | Purpose |
| --- | --- | --- |
| `initialize` | Issuer authorization | Configure the single trusted credential issuer |
| `issuer` | Public | Read the configured issuer |
| `issue` | Issuer authorization | Create a wallet-owned skill credential |
| `get` | Public | Read the complete credential record |
| `verify` | Public | Validate ownership and active status |
| `revoke` | Issuer authorization | Permanently invalidate a credential |
