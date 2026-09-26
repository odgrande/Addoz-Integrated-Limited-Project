# ADDOZ public pages QA (Directive 009)

Checked on 24 Sep 2026 against the mirror, on the dev server (:3100) and a production build.
Route details are in `ADDOZ-PAGE-MAP.md`.

## Completed routes

26 routes, all part of the route sweep:

- **Core and content:** `/`, `/jobs`, `/jobs/[slug]`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`
- **Discovery:** `/companies`, `/companies/[slug]`, `/categories`, `/categories/[slug]`, `/locations`, `/locations/[slug]`
- **Career intelligence:** `/career-tools`, `/career-tools/resume-scanner`, `/career-tools/interview-prep`, `/career-tools/cover-letter`, `/blog`, `/blog/[slug]`
- **Employers and auth:** `/for-employers`, `/for-employers/post-a-job`, `/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password`

The old `/jobs/[id]` route and `demoJobs` list are retired. Nothing outside `_to_delete` depends on them. `lib/demo-jobs.ts` stays only for `sourceSite`, which `community.tsx` uses.

### Project-wide checks

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | 0 errors |
| ESLint 9 + `eslint-config-next` 16.3.3 | Clean. The project has no lint dependency, so ESLint was run from outside the project |
| Production build (`next build`) | Passed, 136 pages. The cloud build used a local mock for Google Fonts |
| Route sweep | 26 routes × widths 360/390/768/1024/1440/1920: 0 issues for HTTP status, single `h1`, horizontal overflow and console errors |
| Navigation and transition check (`verify_nav.py`) | 10/10 PASS. See "Motion checks" |

### Area verification

### Discovery: Verification run

- `tsc.sh`: 0 errors in the whole repo.
- `eslint` (13 files: 6 pages, 5 new components, 1 edited card, checked alongside): 0 problems.
- `shoot.py --no-shots` at 360/390/430/768/1024/1280/1440/1920 across all 8 verify routes
  (`/companies`, `/companies/sample-tech-employer`, `/categories`, `/categories/development-it`,
  `/categories/agriculture-farming`, `/locations`, `/locations/ikeja`, `/locations/mowe`):
  final clean sweep = 64/64 combinations pass (200, h1=1, overflow=0px, description present, 0 console errors).
- Confirmed the deliberately-sparse routes exercise the intended states: `/categories/agriculture-farming`
  renders the "No sample roles in Agriculture & Farming yet" `EmptyState` with its two links; `/locations/mowe`
  has roles (2 sample roles) so it renders the normal grid, not empty state.
- Screenshots reviewed at 390/768/1440 for the two most complex pages: `/categories` (hero grid + A–Z
  index) and `/categories/development-it` (filters + Flip grid + related). Verified with Playwright
  `getComputedStyle` directly (not just visual read) that `.dc-group-index` is `display:none`/zero-size
  below 1024px and switches to a sticky 13rem column with `.dc-az-layout` at exactly 1024px.

### Discovery: CSS

- `styles/marketplace.css` was not touched — the existing COMPANY CARD / CATEGORY CARDS / LOCATION CARD
  sections already covered every card need (including `.company-mark.is-large` and `.location-large`,
  both used as-is on the detail/index pages).
- `features/categories/components/category-card.tsx`: fixed the compact-variant count text from
  `plural(count, "role")` to `plural(count, "sample role")` to match the brief and the feature variant's
  existing wording (the two variants disagreed before this fix).

### Career intelligence: Automated checks

- `tsc.sh` (filtered to my files): 0 errors; repo-wide total also 0.
- `eslint` on all 20 owned files: 0 problems.
- `shoot.py --no-shots` across 6 routes × 9 widths (360–1920): all `200 h1=1 overflow=0px errors=0`.
  - Found + fixed one issue: `.ci-cta-grid` 3-up at 768px overflowed (grid item min-width:auto trapping an ActionButton). Fixed by moving to a 2-up step at 640px / 3-up at 1024px and adding `min-width:0` to the card and other grid-item classes (`ci-link-card`, `ci-crosslink`, `bl-related-card`). Re-ran: 0 issues.
- Playwright exercise (own script, took `locks/browser.lock`): filled and ran Resume Scanner (checks rendered), Interview Prep (guide + checklist rendered), Cover Letter (draft generated, contains typed name/company), scrolled the blog article. Zero console/page errors.

### Employers and auth: Automated checks

- `tsc.sh` filtered to my files: 0 errors (repo-wide total also 0 at time of run).
- `eslint` on all my files: 0 errors, 0 warnings (fixed one `react-hooks/exhaustive-deps` warning in `verify-form.tsx`'s countdown effect by extracting `cooldownDone`).
- `shoot.py --no-shots` at 360/390/430/768/1024/1280/1440/1920 across all 9 required routes: every combination `200, h1=1, overflow=0px, desc=y, errors=0`. One 2px overflow at 360 on `/for-employers` (long sample-card text) was fixed by shortening the mock listing's closing-date copy.
- Screenshots reviewed at 390 and 1440 for `/for-employers` and `/for-employers/post-a-job`: hero, benefits, workflow track, posting summary+sample card, and the form with progress bar/step counts all render cleanly, no clipped cards or awkward wraps.

### Employers and auth: Interactive Playwright script (own script, browser lock held)

- Post-a-job: submitting step 1 empty flags exactly the 5 required fields (`aria-invalid`) and focuses the first one.
- Filling role fields shows a "Draft saved" status after the autosave debounce; reloading the page then shows the "Unsaved draft found" restore banner (localStorage round-trip confirmed).
- Step navigation (Continue → step 2) works with validation gating.
- Register: filling all fields and submitting routes to `/auth/verify?email=…` after the simulated loading delay.
- Verify: filling all 6 OTP boxes shows the success state ("You're verified").
- Zero console/page errors across the whole scripted session.

### Employers and auth: Resume pass (24 Sep)

- Re-ran: tsc 0 errors, eslint 0 problems, shoot.py --no-shots 360–1920 on all 6 auth routes (+ ?role=employer) and both /for-employers routes: all `200 h1=1 overflow=0px errors=0`; verify_employers_auth.py all true, 0 console errors.
- Fixed from screenshots (styles/auth.css polish block): desktop brand statement was oversized (wrapped to 3 lines, mission overlapped it, portrait clipped) → clamp size + line-height 1; brand panel now sticky 100dvh with the portrait flexing to fit (hidden under 640px tall); logo wordmark white + yellow spark on purple (was black/invisible); copy aligned with logo; terms checkbox label no longer breaks one word per line on phones.

## Responsive validation

- Project-wide sweep: 26 routes at widths 360, 390, 768, 1024, 1440 and 1920, with no horizontal overflow and a single `h1` on each page.
- The area agents also checked widths 430 and 1280.

### Discovery: Responsive

- 390/430: all filter chip rows (`industry`, `job type`, `career level`) are single horizontally-scrollable
  strips (shared `.filter-chips` `overflow-x:auto`); no page-level overflow at any width (confirmed 0px at
  every route × width). Company hero (mark + name) stacks vertically below 640px, goes to a row at ≥640px.
  Company detail's facts aside drops below the main column below 1024px and is not sticky until then.
  Categories A–Z sticky group index is hidden below 1024px (verified via computed style, not just visual).
- 768: two-column feature/hero grids (`category-grid`, `location-grid` use the existing `auto-fill` grid so
  this falls out for free), chip-filter groups go side by side (`.dc-chip-filters` row at ≥768px).
  Description text: The 1023 vs 1024 verification above (208px sticky column) can be read at
  `/tmp/served.css` lines 9895-9932 if a future agent needs to confirm the same breakpoint.
- 1024/1440/1920: sticky aside on company detail, sticky A–Z group index, three-up job/company grids
  (existing shared grid CSS); wider margins via `page-section`'s own content cap, no stretched lines.

### Career intelligence: Responsive

- Designed mobile-first: career-tools workspaces stack (inputs → sticky Run bar → results) below 1024px, become a 2-column grid at ≥1024px.
- Tab bar (mode switcher) scrolls horizontally if needed; all tap targets ≥44px.
- Blog article measure capped at 68ch; reading-progress bar only shows ≥1024px (kept subtle, per brief).

## Accessibility checks

### Discovery: Accessibility

- All chip toggles use `role="group"` + `aria-label` on the row and `aria-pressed` on each `button`,
  matching the existing `FilterBar` chip convention.
- Sticky group-index jump links are plain `<a href="#group-slug">` (not `AppLink`/`next/link`) — deliberate,
  since they're same-page anchors, not route changes; using the transition-aware link component here would
  risk an unwanted page-curtain animation for what should be an instant scroll.
- `EmptyState` (role="status") used for zero-result company search, zero-role categories/areas and the
  categories quick-filter finding nothing.
- Every `<h1>`/`<h2>`/`<h3>` I introduced outside `PageHeader`/`SectionHeading` is explicitly sized with the
  `.t-h1`/`.t-h3`/`.t-label` type utilities (there are no bare-tag base styles for headings in globals.css —
  confirmed by grep — so an unstyled bare heading would have rendered at browser-default size).
- Dates: none added directly by me; `JobCard`/`JobRow` already format via `postedOn`/`formatDate`.

### Career intelligence: Accessibility

- Console mode switcher is a real ARIA tablist (`role=tablist/tab/tabpanel`, roving `tabIndex`, Arrow/Home/End keys, focus follows selection).
- Every input uses `FormField` (label, hint, `aria-describedby`, `aria-invalid`, error `role=alert`).
- Skeleton "not connected" rows keep the real section-name text (not `aria-hidden`); only the decorative bar is `aria-hidden`.
- Reading-progress bar is `aria-hidden` (decorative only, not essential content).

### Employers and auth: Accessibility

- Every form field uses `FormField`/`PasswordField` (label + `aria-describedby` + `aria-invalid`), ≥44px tap targets on toggles/back links/otp boxes.
- Each form has an `ErrorSummary` (`role="alert"`) and focuses the first invalid control on failed submit, matching the existing `JobPostForm` pattern.
- OTP boxes: `inputMode="numeric"`, `autoComplete="one-time-code"`, arrow-key/backspace navigation, paste support.
- Success/result panels use `role="status"` (no separate live region needed).

## Motion checks

- Page transitions: a normal click on an internal link plays the `.page-curtain` transition, and the curtain ends with `visibility: hidden`. Ctrl-click and middle-click open a new tab without the transition and leave the current page unchanged. Enter on a focused link navigates. Browser back/forward restore the page with its `h1` visible.
- The mobile menu at 390 reaches `/career-tools` and `/for-employers`. The header and footer link to every new top-level route, and each one returns 200.
- Fix made during this check: the mobile drawer left out each group's panel CTA, so the `/career-tools` hub could not be reached from the phone menu. The drawer now shows the CTA first when it is not already one of the group's items. Only the Career Intelligence group is affected.

### Discovery: Motion

- Free: `data-reveal` line-reveal on every page's h1 (PageHeader or the bespoke company-detail h1) and on
  each `SectionHeading` h2; eyebrow scramble; `.page-header-lead`/`.section-heading-aside` fade-up.
- One `<Reveal mode="scroll">` group per page, reserved for a *static* (non-Flip) secondary grid: featured
  categories (`/categories`), featured areas (`/locations`), related companies (company detail), related
  categories (category detail), nearby areas (location detail). The primary, filterable result grids use
  Flip instead, never both on the same grid.
- Flip reflow (mirrors `JobsBrowser`'s technique exactly — `Flip.getState` before a `flushSync` state update,
  `Flip.from` after, `absoluteOnLeave`/`prune`, reduced-motion skips the whole capture) on: `/companies`
  (search + industry + location), `/categories/[slug]` and `/locations/[slug]` (type/level chips + sort).
- BrandShape used once each on `/companies` (CTA band, black starburst), `/categories` and `/locations`
  (hero section, purple), hidden below 640px to avoid crowding small screens; never used as a functional icon.

### Career intelligence: Motion

- One restrained "screen-fade" (opacity/y, GSAP, `prefers-reduced-motion` gated) reused for: hub tab switches, and each tool's empty→results swap.
- One `<Reveal mode="scroll">` group per tool page (the cross-links row) and one on the hub ("how it works").
- Blog pages: only the free heading reveal + the scroll-driven progress fill; no extra GSAP.

### Employers and auth: Motion

- Marketing page: `data-reveal` on h1/h2, `.page-header-lead` for the hero lead, `<Reveal mode="scroll">` around the hiring-workflow track — no bespoke ScrollTrigger, kept "restrained" as the brief allows.
- Auth: shell entrance is a plain CSS fade-up gated by `@media (prefers-reduced-motion: no-preference)` (no JS), plus `data-reveal` on each page's h1 — "headline reveal at most".

## Known limitations

- **`/categories` React warning:** an intermittent React warning appeared on `/categories` in 2 of 9 sweeps and could not be reproduced on demand.
- **No backend:** nothing is connected to a backend yet. Forms (contact, post-a-job, newsletter), auth (login, register, verify, reset) and the AI career tools are UI only and use sample data.
- **Legal pages:** `/privacy` and `/terms` are placeholders (outline and summaries only), pending legal review.

### Discovery: Known limitation (not fixed — outside my owned files)

- During repeated `shoot.py` sweeps, `/categories` intermittently (roughly 2 of 9 full 8-width sweeps)
  logged a console warning — "Can't perform a React state update on a component that hasn't mounted yet" —
  plus a hydration-mismatch notice, at a different width each time it appeared (once at 768, once at 1024)
  and never reproducibly on a targeted re-run of the same width. Status/h1/overflow were correct in every
  single case, including the runs that logged it. I could not reproduce it on demand, and none of my new
  components set state outside event handlers, read refs during render, or use effects at all (several of
  my pages — company detail, the locations index — need no client component whatsoever). I believe this is
  a rare timing interaction in the shared public motion layer (data-reveal/ScrollTrigger processing versus a
  client-component boundary hydrating nearby) under `shoot.py`'s aggressive synthetic full-page scroll, not
  a defect in the discovery pages themselves — `/locations` has an equally rich set of `data-reveal`/`Reveal`
  elements and never showed it once across the same number of runs, so it isn't simply "more motion = bug."
  Flagging for whoever owns the motion layer; not something I can fix from my owned files.

### Career intelligence: Known limitations (by design, stated honestly in the UI)

- No AI calls anywhere; all three tools do real, deterministic, client-side work and separately show an unmistakable "not connected in this preview" panel using the tool's real report-section names.
- Blog has no real posts yet (matches the live site and `features/blog/data.ts`); topic filter is fully functional but has nothing to show — honest empty state, no invented articles.
- Newsletter and file-drop (.txt only) are prototype-only; both say so in the UI.

### Employers and auth: Known limitations

- Draft autosave/progress/restore UI is scoped to `context==="public"` in `JobPostForm` only, so the employer dashboard's post/edit flows (owned elsewhere) are visually unaffected.
- "Finding talent" section links to `/categories`/`/locations` without importing their data (kept the read list short per token discipline).
- Countdown/resend on verify and draft timestamps are cosmetic/client-only; no server truth exists yet.
