# Shared Layouts

## Application Shell

- Path: `src/App.tsx`
- Description: Route switch, public navigation, wallet modal, onboarding flow, and global Albedo assistant.

```tsx
function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const wallet = useWallet()

  return (
    <>
      {location.pathname === '/verify' ? (
        <PublicVerification />
      ) : location.pathname === '/recruiters' ? (
        <RecruiterPortal />
      ) : location.pathname === '/admin' ? (
        <AdminDashboard connection={wallet.connection} onDisconnect={disconnectAndExit} />
      ) : location.pathname === '/recruiter-dashboard' ? (
        <RecruiterDashboard profile={profile} connection={wallet.connection} onOpenWallet={() => setWalletModalOpen(true)} onDisconnect={disconnectAndExit} />
      ) : location.pathname === '/dashboard' ? (
        <Dashboard profile={profile} connection={wallet.connection} onOpenWallet={() => setWalletModalOpen(true)} onDisconnect={disconnectAndExit} />
      ) : (
        <main>{landingPage}</main>
      )}
      <WalletModal />
      <OnboardingFlow />
      <AlbedoAssistant role={onboardingComplete ? profile.role : 'visitor'} />
    </>
  )
}
```

## Talent Workspace

- Path: `src/components/Dashboard.tsx`
- Description: Responsive sidebar, command search, top bar, overview, opportunities, assessments, credentials, verification, profile, and settings.

```tsx
<main className="dashboard-layout">
  <aside className="dashboard-sidebar">
    <div className="dashboard-brand">SkillChain AI</div>
    <nav className="dashboard-nav">{navItems}</nav>
    <div className="sidebar-wallet">{walletIdentity}</div>
  </aside>
  <section className="dashboard-main">
    <header className="dashboard-topbar">{searchAndProfile}</header>
    <div className="dashboard-content">{activeWorkspaceSection}</div>
  </section>
</main>
```

## Recruiter Workspace

- Path: `src/components/RecruiterDashboard.tsx`
- Description: Recruiter-specific sidebar, talent search, hiring overview, applications, verification, and review history.

```tsx
<main className="dashboard-layout recruiter-dashboard">
  <aside className="dashboard-sidebar">{recruiterNavigation}</aside>
  <section className="dashboard-main">
    <header className="dashboard-topbar">{talentSearch}</header>
    <div className="dashboard-content">{recruiterWorkspace}</div>
  </section>
</main>
```

## Admin Workspace

- Path: `src/components/AdminDashboard.tsx`
- Description: Private operations shell with activity, dependency health, wallet proofs, and transaction IDs.
