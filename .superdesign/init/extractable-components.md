# Extractable Components

## PublicNavigation

- Source: `src/App.tsx`
- Category: layout
- Description: Brand, public navigation, verification route, and wallet action
- Extractable props: `connected`, `activeItem`, `menuOpen`
- Hardcoded: SkillChain mark, route labels, Lucide icons

## DashboardSidebar

- Source: `src/components/Dashboard.tsx`
- Category: layout
- Description: Talent workspace navigation and wallet identity
- Extractable props: `activeItem`, `connected`, `network`, `badgeCount`, `isExpanded`
- Hardcoded: Navigation labels and Lucide icons

## RecruiterSidebar

- Source: `src/components/RecruiterDashboard.tsx`
- Category: layout
- Description: Hiring workspace navigation and wallet identity
- Extractable props: `activeItem`, `connected`, `reviewCount`, `isExpanded`
- Hardcoded: Navigation labels and Lucide icons

## TopCommandBar

- Source: `src/components/UniversalSearch.tsx`
- Category: layout
- Description: Audience-aware universal search and command results
- Extractable props: `audience`, `showResults`
- Hardcoded: Search icon and result section labels

## ProfileChip

- Source: `src/components/Dashboard.tsx`
- Category: basic
- Description: Compact avatar, display name, and role trigger
- Extractable props: `showNotification`
- Hardcoded: Profile structure

## MetricCard

- Source: `src/components/Dashboard.tsx`
- Category: basic
- Description: Icon, metric value, label, and contextual status
- Extractable props: none
- Hardcoded: Layout and visual treatment

## CredentialCard

- Source: `src/App.tsx`
- Category: basic
- Description: 3D-ready verified skill passport card
- Extractable props: `isVerified`
- Hardcoded: Credential anatomy and icons
