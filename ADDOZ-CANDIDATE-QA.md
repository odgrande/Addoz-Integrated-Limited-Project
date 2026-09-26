# ADDOZ Candidate Application QA

**Directive:** 011
**Verification target:** candidate application routes, server data access, and public job actions

## Automated checks

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed after candidate implementation and public job integration. |
| `pnpm build` | Passed — all eight candidate pages and the candidate API compiled and generated successfully. |
| Unauthenticated page protection | Passed — `/candidate/dashboard` redirects to `/auth/login`. |
| Unauthenticated API protection | Passed — `/api/candidate/saved-jobs` returns `401`. |
| Authenticated candidate pages | Passed — all eight requested pages return `200` with a real Better Auth session. |
| Authenticated mutation flow | Passed — registration, save, profile update, application creation, application history, and duplicate application `409` were exercised against the development database. |
| Public homepage regression | Passed — `/` returns `200`; public homepage files were not changed. |
| Session-scoped candidate reads | Covered by `requireCandidate` in `features/candidates/queries.ts`. |
| Session-scoped candidate mutations | Covered by `app/api/candidate/[resource]/route.ts`. |
| Duplicate applications | Database unique index plus `409` API response. |
| Saved-job uniqueness | Composite primary key plus idempotent API insert. |

## Manual route matrix

| Area | Expected behavior |
| --- | --- |
| Authentication | Unauthenticated candidate page requests redirect to `/auth/login`; API requests return `401`. |
| Dashboard | Shows authenticated name, completion, recommendations, applications, saved jobs, alerts, resume, intelligence shortcuts, and notifications. |
| Profile | Updates name and candidate profile fields without accepting a client candidate ID. |
| Resume | Creates, replaces, and removes metadata; empty state is visible before first save. |
| Applications | Job detail creates one application, redirects to history, and duplicate submission returns a useful error. |
| Saved jobs | Public job detail and dashboard controls update database-backed state optimistically and roll back failed writes. |
| Application status | History renders the persisted `stage` value. |
| Job alerts | Creates, pauses, resumes, and deletes alerts scoped to the current candidate. |
| Notifications | Shows empty and populated states and marks notifications read. |
| Settings | Updates display name while keeping email read-only. |
| Loading/error | Candidate route group exposes a loading skeleton and retryable error state. |
| Accessibility | Controls have labels, pressed states, status messages, semantic headings, keyboard-visible focus, and responsive list layouts. |

## Responsive viewport review

Review at `390`, `768`, `1024`, and `1440` pixels. Confirm:

- mobile bottom navigation does not cover the final content
- forms collapse to one column at phone widths
- candidate lists wrap without horizontal overflow
- 1024px switches to the fixed sidebar cleanly
- 1440px keeps panels readable instead of stretching text measures
- reduced-motion users receive no GSAP reveal
