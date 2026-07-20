# Route Map

Router: `BrowserRouter` in `src/main.tsx`; route switching currently lives in `src/App.tsx`.

| Route | Component | Layout |
| --- | --- | --- |
| `/` | `src/App.tsx` landing branch | Public shell |
| `/dashboard` | `src/components/Dashboard.tsx` | Talent workspace |
| `/recruiter-dashboard` | `src/components/RecruiterDashboard.tsx` | Recruiter workspace |
| `/recruiters` | `src/components/RecruiterPortal.tsx` | Public recruiter portal |
| `/verify` | `src/components/PublicVerification.tsx` | Public verification |
| `/admin` | `src/components/AdminDashboard.tsx` | Admin workspace |

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```
