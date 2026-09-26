# ADDOZ — Current State Audit

**Directive:** 002 — Audit, Repair and Evolve the Existing v0 Prototype
**Audited:** 2026-09-22
**Auditor:** Claude (Cowork session)

---

## CRITICAL ISSUE — RESOLVED

### Entry point not wired to ADDOZ homepage

**Root cause:** When v0 exports a project, it scaffolds `app/page.tsx` with a generic placeholder component instead of automatically wiring the generated implementation.

**Before (`app/page.tsx`):**
```tsx
export default function Page() {
  return (
    <main>
      <p>Your v0 generation will show here.</p>
    </main>
  )
}
```

**After (`app/page.tsx`) — FIXED:**
```tsx
import { Homepage } from "@/components/addoz/homepage"

export default function Page() {
  return <Homepage />
}
```

The actual homepage implementation was complete and correct in `components/addoz/homepage.tsx`. No duplicate was created. The fix is a clean three-line import.

---

## COMPONENT INVENTORY

All components exist under `components/addoz/` as directed.

| File | Exports | Status |
|---|---|---|
| `homepage.tsx` | `Homepage` | ✅ Complete — now wired |
| `hero.tsx` | `Hero`, `OpportunityTicker` | ✅ Complete |
| `job-discovery.tsx` | `JobDiscovery`, `SearchState` | ✅ Complete |
| `explore.tsx` | `Explore` | ✅ Complete |
| `career-journey.tsx` | `CareerJourney` | ✅ Complete |
| `ecosystem.tsx` | `EmployerSection`, `CareerIntelligence` | ✅ Complete |
| `community.tsx` | `Community` | ✅ Complete |
| `site-footer.tsx` | `Newsletter`, `SiteFooter`, `MotionGuide` | ✅ Complete |
| `site-header.tsx` | `SiteHeader`, `Logo` | ✅ Complete |
| `page-transition.tsx` | `PageTransition`, `TransitionLink` | ✅ Complete |

**Note:** `CareerIntelligence` and `EmployerSection` are co-located in `ecosystem.tsx` — structurally fine. No refactoring required at this stage.

---

## MISSING COMPONENT CSS — HIGHEST REMAINING RISK

**This is the most significant structural gap in the export.**

`app/globals.css` is 164 lines. It contains only Tailwind v4 imports, shadcn CSS custom property tokens, and `@layer base` resets. **It contains zero ADDOZ component styles.**

Every ADDOZ component relies on custom class names that do not exist in any file in this export — `hero`, `hero-line`, `portrait-card`, `job-card`, `ticker-track`, `tool-card`, `journey-step`, `page-curtain`, `section-pad`, `eyebrow`, `action-button`, and ~80 more.

**Immediate action required:** The component CSS was generated inside the v0 environment and must be exported from there. Until this file is restored, the prototype renders as unstyled HTML.

**Recommended path:** Copy the full CSS from the v0 preview environment and add it to `app/globals.css` (or a dedicated `app/addoz.css` imported from `layout.tsx`).

---

## AUDIT FINDINGS

### 1. BROKEN / DEAD / DUPLICATE

| ID | Severity | Location | Finding |
|---|---|---|---|
| A-01 | 🔴 Critical | `app/page.tsx` | v0 placeholder — **FIXED** |
| A-02 | 🔴 Critical | `app/globals.css` | ADDOZ component CSS entirely absent |
| A-03 | 🟠 High | `package.json` | `"name": "my-project"` — **FIXED** to `addoz-platform` |
| A-04 | 🟠 High | `app/layout.tsx` | `generator: 'v0.app'` in metadata — **FIXED** (removed) |
| A-05 | 🟡 Medium | `package.json` | `"cn": "^0.3.2"` is redundant — project already provides `cn()` via `clsx` + `tailwind-merge`. Remove. |
| A-06 | 🟡 Medium | `app/` | No `not-found.tsx` — **FIXED** (added) |
| A-07 | 🟡 Medium | `app/` | No `error.tsx` — **FIXED** (added) |
| A-08 | 🟡 Medium | `app/` | No `loading.tsx` — add a minimal skeleton for route transitions |
| A-09 | 🟡 Medium | `lib/motion.ts` | `"use client"` on a `.ts` utility. Functionally correct — prevents GSAP from bundling into server components — but unconventional. Add a comment explaining intent. |

### 2. CLIENT / SERVER BOUNDARY

| ID | Severity | Finding |
|---|---|---|
| B-01 | ✅ Correct | `app/jobs/[id]/page.tsx` is a Server Component importing Client Components — Next.js handles this correctly. |
| B-02 | ✅ Correct | All `components/addoz/*.tsx` are explicitly `"use client"`. Correct given GSAP and state usage. |
| B-03 | ✅ Correct | `lib/motion.ts` GSAP registration marked `"use client"` — prevents SSR execution. |

### 3. GSAP IMPLEMENTATION

| ID | Severity | Finding |
|---|---|---|
| G-01 | ✅ Correct | `hero.tsx` — `SplitText.create()` reverted inside `mm.add` return. Correct lifecycle. |
| G-02 | ✅ Correct | `homepage.tsx` — `mm.revert()` + cleanup array correctly handled. |
| G-03 | ✅ Correct | `career-journey.tsx` — ScrollTrigger pin guarded by `min-width: 900px`. Mobile gets unpinned layout. |
| G-04 | ✅ Correct | `job-discovery.tsx` — Flip uses `flushSync` to capture state before React commits. |
| G-05 | ✅ Correct | `explore.tsx` — Same Flip pattern. Correct. |
| G-06 | 🟡 Medium | `community.tsx` — `busy.current = true` only reset in `onComplete`. If unmounted mid-animation, ref stays `true`. Low risk for prototype. |
| G-07 | ✅ Correct | `page-transition.tsx` — `gsap.killTweensOf` in cleanup. Full modifier-key detection preserves browser-native behaviour. |
| G-08 | ✅ Correct | `site-header.tsx` — `dependencies: [open]` on `useGSAP`. Correct. |
| G-09 | ✅ Correct | `opportunity-ticker.tsx` — Accessible pause/play. Tween stored in `useRef`, controlled correctly. |
| G-10 | 🟡 Medium | `hero.tsx` — Spark scroll parallax is intentional (continuous scrub). Add `will-change: transform` to `.hero-spark` in CSS. |
| G-11 | 🟡 Medium | `homepage.tsx` — Magnetic listeners bound once at mount. New `[data-magnetic]` elements added after mount won't get listeners. Document for production. |

### 4. ACCESSIBILITY

| ID | Severity | Finding |
|---|---|---|
| AC-01 | ✅ Correct | Skip link present. All `<main>` elements have `id="main"`. |
| AC-02 | ✅ Correct | Portrait divs use `role="img"` with descriptive `aria-label`. |
| AC-03 | ✅ Correct | Job grid `aria-live="polite"`. Save button `aria-pressed` + descriptive `aria-label`. |
| AC-04 | ✅ Correct | Ticker moving track `aria-hidden`. Pause button has dynamic `aria-label`. |
| AC-05 | ✅ Correct | Accordion buttons have `aria-expanded` + `aria-controls`. `hidden` attribute used correctly. |
| AC-06 | 🟡 Medium | Location `<select>` has visually hidden `FieldLabel`. Correctly associated. |
| AC-07 | 🟡 Medium | Mobile nav lacks focus trap. Keyboard focus can escape behind the overlay. Fix for production. |
| AC-08 | 🟡 Medium | Color contrast for `.text-cobalt`, `.mark-yellow`, `.mark-orange` depends on missing CSS. Verify WCAG AA (4.5:1 for text) once styles are restored. |

### 5. HYDRATION RISKS

| ID | Severity | Finding |
|---|---|---|
| H-01 | ✅ Correct | `reducedMotion()` guards `window.matchMedia` with `typeof window !== "undefined"`. |
| H-02 | ✅ Correct | `new Date().getFullYear()` in footer — static at build time. Acceptable. |
| H-03 | 🟡 Medium | Page curtain may flash at initial position before GSAP sets `yPercent: 100`. Add `style={{ transform: 'translateY(100%)' }}` as inline initial state to `PageTransition`'s curtain div. |

### 6. SEO

| ID | Severity | Finding |
|---|---|---|
| S-01 | 🟠 High | `generator: 'v0.app'` in metadata — **FIXED** (removed) |
| S-02 | 🟡 Medium | No `openGraph` or `twitter` metadata in layout. Add OG image for social sharing. |
| S-03 | ✅ Correct | Prototype job pages have `robots: { index: false, follow: false }`. |
| S-04 | 🟡 Medium | No `sitemap.ts`. Add for production. |
| S-05 | 🟡 Medium | No `robots.txt`. Add for production. |
| S-06 | ✅ Correct | Heading hierarchy is correct throughout (one `<h1>` per page). |

### 7. SECURITY HEADERS

| ID | Severity | Finding |
|---|---|---|
| SEC-01 | ✅ Present | `X-Content-Type-Options`, `Referrer-Policy`, `HSTS`, `Permissions-Policy` all set. |
| SEC-02 | 🟠 High | `X-Frame-Options` missing — **FIXED** (added `SAMEORIGIN`) |
| SEC-03 | 🟡 Medium | No `Content-Security-Policy`. Add for production (carefully — GSAP + Fonts + Analytics need allowlisting). |

### 8. NAVIGATION

| ID | Severity | Finding |
|---|---|---|
| N-01 | ✅ Correct | `TransitionLink` checks all modifier keys + `target="_blank"` before intercepting. Browser-native behaviour fully preserved. |
| N-02 | 🟡 Medium | Mobile nav has no focus return to toggle button on close. Fix for production. |
| N-03 | 🟡 Medium | Two routes currently (`/` and `/jobs/[id]`). Nav hash links are correct for current scope. |

### 9. PROTOTYPE-ONLY LOGIC

| ID | Location | Description |
|---|---|---|
| P-01 | `lib/demo-jobs.ts` | 6 hardcoded illustrative roles. Correctly labelled throughout UI. |
| P-02 | `lib/demo-jobs.ts` | `sourceSite = "https://addozconsultinglimited.com"` — WordPress fallback. All `target="_blank" rel="noreferrer"`. Correct. |
| P-03 | `job-discovery.tsx` | `saved` state is React state, not persisted. Intentional for prototype. |
| P-04 | `site-footer.tsx` | Newsletter form is prototype-only. Clearly labelled. |
| P-05 | `site-footer.tsx` | `MotionGuide` dialog — prototype-only GSAP documentation. Remove before production. |

### 10. UNUSED DEPENDENCIES

| Package | Action |
|---|---|
| `cn` (npm) | Remove — duplicates `lib/utils.ts` cn() |
| `shadcn` | Move to `devDependencies` |

---

## FILES ADDED BY THIS DIRECTIVE

| File | Reason |
|---|---|
| `app/page.tsx` | Fixed: wired to `Homepage` component |
| `app/not-found.tsx` | Added: 404 page |
| `app/error.tsx` | Added: error boundary |

## FILES MODIFIED BY THIS DIRECTIVE

| File | Change |
|---|---|
| `app/layout.tsx` | Removed `generator: 'v0.app'` from metadata |
| `next.config.mjs` | Added `X-Frame-Options: SAMEORIGIN` |
| `package.json` | Renamed from `my-project` to `addoz-platform` |

---

## ISSUES TO RESOLVE BEFORE BACKEND DEVELOPMENT

1. **Reconstruct the ADDOZ component CSS** — blocker for all visual work
2. **Remove redundant `cn` package** from dependencies
3. **Add `app/loading.tsx`** — skeleton screen for route loads
4. **Add `app/sitemap.ts`** — production SEO
5. **Add `public/robots.txt`** — disallow prototype job pages until live
6. **Add OG metadata** to layout
7. **Fix page curtain initial state** (H-03)
8. **Add focus trap to mobile nav**
9. **Replace `images: { unoptimized: true }`** in next.config.mjs for production
10. **Audit color contrast** once CSS is restored
11. **Add CSP header** before production launch
