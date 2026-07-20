# Page Dependency Trees

## `/`

Entry: `src/App.tsx`

- `src/App.tsx`
  - `src/hooks/useWallet.ts`
    - `src/lib/wallet.ts`
    - `src/lib/api.ts`
  - `src/components/WalletModal.tsx`
  - `src/components/OnboardingFlow.tsx`
  - `src/components/AlbedoAssistant.tsx`
  - `src/styles.css`

## `/dashboard`

Entry: `src/components/Dashboard.tsx`

- `src/components/Dashboard.tsx`
  - `src/components/UniversalSearch.tsx`
  - `src/components/RepositorySelector.tsx`
  - `src/components/AssessmentExperience.tsx`
  - `src/components/DashboardSection.tsx`
    - `src/components/JobMarketplace.tsx`
    - `src/components/CredentialVerifier.tsx`
  - `src/lib/onboarding.ts`
  - `src/lib/wallet.ts`
  - `src/lib/api.ts`
  - `src/data/jobs.ts`
  - `src/data/companies.ts`
  - `src/styles.css`

## `/recruiter-dashboard`

Entry: `src/components/RecruiterDashboard.tsx`

- `src/components/RecruiterDashboard.tsx`
  - `src/components/UniversalSearch.tsx`
  - `src/components/TalentMarketplace.tsx`
  - `src/components/RecruiterApplications.tsx`
  - `src/components/CredentialVerifier.tsx`
  - `src/data/talent.ts`
  - `src/lib/recruiterHistory.ts`
  - `src/lib/wallet.ts`
  - `src/lib/api.ts`
  - `src/styles.css`

## `/verify`

Entry: `src/components/PublicVerification.tsx`

- `src/components/PublicVerification.tsx`
  - `src/components/CredentialVerifier.tsx`
  - `src/lib/api.ts`
  - `src/styles.css`

## `/admin`

Entry: `src/components/AdminDashboard.tsx`

- `src/components/AdminDashboard.tsx`
  - `src/lib/adminAccess.ts`
  - `src/lib/api.ts`
  - `src/lib/wallet.ts`
  - `src/styles.css`
