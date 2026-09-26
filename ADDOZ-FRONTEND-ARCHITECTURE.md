# ADDOZ — Frontend Architecture (Directive 006)

**Status:** Supplements `ADDOZ-ARCHITECTURE-DECISIONS.md` (Directive 002 ADRs) — does not replace it. Read that file first for database/auth/AI/deployment decisions, which are unchanged. This file covers only frontend structure decisions made or confirmed during Directive 006.

---

## 1. Component layer — confirmed, not restructured

```
components/
  addoz/     — page sections, flat (no subfolders). 10 files, ~370 lines total.
  ui/        — shadcn/Base UI primitives (button, badge, dialog, field, input, toggle-group, ...)
```

Per ADR-013 in `ADDOZ-ARCHITECTURE-DECISIONS.md`: `components/addoz/` stays flat "until component count justifies sub-directories." At 10 files it does not yet. No change made.

## 2. Reuse that already exists (don't rebuild this)

Before extracting new React primitives, note what's already shared:

- **CSS-level reuse:** `.eyebrow`, `.action-button` (+ `.action-dark/yellow/blue/orange/ghost`), `.section-heading`, `.text-link`, `data-reveal`, `data-magnetic` are shared classes used identically across every section. This *is* the project's primitive system — it just lives in CSS rather than as wrapped components.
- **`cn()` utility** (`lib/utils.ts`) for conditional class composition — used consistently.
- **`TransitionLink`** (`page-transition.tsx`) — the one cross-cutting behavioural primitive (page-curtain-aware link), used everywhere instead of raw `next/link`.

**Recommendation, not done this pass:** if a future directive wants to reduce JSX duplication specifically (not CSS duplication, which is already low), the highest-value candidates are `<Eyebrow>` (the `<div className="eyebrow"><span className="eyebrow-line" /> TEXT</div>` pattern appears identically 8 times) and `<SectionHeading>`. Both are low-risk because they wrap existing CSS classes rather than introducing new ones.

## 3. Routing — current state vs. target

**Current:**
```
app/
  page.tsx              → <Homepage /> (all sections, single scroll experience)
  jobs/[id]/page.tsx     → job detail (SSG from lib/demo-jobs.ts)
  not-found.tsx, error.tsx
```

**Target** (recorded in ADR-013, unchanged by this directive):
```
/, /jobs, /jobs/[slug], /companies, /companies/[slug],
/categories, /locations, /career-tools(/resume-scanner|/interview-prep|/cover-letter),
/for-employers, /about, /contact
(auth) and (candidate)/(employer)/(admin) route groups — post-backend
```

**Why the gap wasn't closed this session:** job discovery, category exploration, and location browsing currently live as homepage sections with anchor links (`#jobs`, `#explore`), not standalone routes. Scaffolding ~10 placeholder pages with no real content to fill them would violate "no half-finished implementations" and wouldn't move the product forward — a route with nothing on it is not more production-grade than no route. This is a product-scope decision (does `/jobs` become the primary discovery surface, with the homepage section becoming a preview/teaser?) that belongs in the next directive, not something to default into silently.

## 4. Motion architecture — see `ADDOZ-MOTION-SYSTEM.md`

Not restructured. `lib/motion.ts` remains the single plugin-registration + shared-constants module; every animated component owns its animation via `useGSAP({ scope: root })`. Full rationale and the updated GSAP target registry are in the motion doc.

## 5. What changed structurally this directive

Only `components/addoz/career-journey.tsx` and its corresponding CSS block in `app/globals.css` (`CAREER JOURNEY` section). No other component, route, or shared utility was restructured. See `ADDOZ-FRONTEND-AUDIT.md` for the specific bugs fixed.

## 6. Build health

- `tsc --noEmit`: clean
- `next build`: succeeds with zero warnings (previous sessions noted a sandbox-only Google Fonts fetch failure in `next build`; not reproduced in this environment — network access to `fonts.googleapis.com` worked)
- No new dependencies added or removed
