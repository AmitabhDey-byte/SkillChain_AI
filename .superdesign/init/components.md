# Shared Components

The current application uses custom React components and vanilla CSS rather than a component library. Most components are feature-level rather than primitives.

## WalletModal

- Path: `src/components/WalletModal.tsx`
- Purpose: Shared wallet connection and session dialog
- Props: `open`, `status`, `connection`, `error`, `onClose`, `onContinue`, `onConnect`, `onDisconnect`

```tsx
export type WalletModalState = 'checking' | 'disconnected' | 'connecting' | 'connected' | 'error'

export type WalletModalProps = {
  open: boolean
  status: WalletModalState
  connection: WalletConnection | null
  error: string | null
  onClose: () => void
  onContinue: () => void
  onConnect: () => Promise<boolean>
  onDisconnect: () => void
}
```

## UniversalSearch

- Path: `src/components/UniversalSearch.tsx`
- Purpose: Shared command-style search for jobs, companies, and talent
- Props: `audience`, `onOpenJobs`, `onOpenTalent`

## CredentialVerifier

- Path: `src/components/CredentialVerifier.tsx`
- Purpose: Shared public credential verification form and status result
- Props: `initialCredentialId`, `initialOwner`, `onVerified`

## AlbedoAssistant

- Path: `src/components/AlbedoAssistant.tsx`
- Purpose: Persistent AI assistant panel
- Props: `role`

## Reusable Patterns

The reusable visual primitives are currently CSS class contracts:

```tsx
<button className="button button--primary">Primary action</button>
<article className="dashboard-card">Card content</article>
<span className="workspace-status workspace-status--complete">Complete</span>
<div className="metric-icon metric-icon--green">Icon</div>
```
