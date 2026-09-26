# ADDOZ — Prototype Gap Report

**Directive:** 002
**Date:** 2026-09-22

This document catalogues every function that is currently simulated, mocked, or linked to the existing WordPress platform.

---

## GAP 001 — Job Data

**Components:** `lib/demo-jobs.ts`, `job-discovery.tsx`, `explore.tsx`, `app/jobs/[id]/page.tsx`

**Current State**
Six hardcoded illustrative roles in `lib/demo-jobs.ts`. Clearly labelled "sample / illustrative / not a live vacancy". Job detail pages statically generated from this array.

**Required Production State**
Roles fetched from PostgreSQL. Server-side search. Pagination. Rich job data: employer logo, salary range, deadline, responsibilities, requirements. Dynamically rendered detail pages.

**Proposed Implementation**
```
lib/db/schema/jobs.ts        — Drizzle table definition
lib/db/queries/jobs.ts       — getJobs(), getJobById(), searchJobs()
features/jobs/actions.ts     — Server Actions wrapping db queries
app/jobs/page.tsx            — Server-rendered listing with search params
app/jobs/[id]/page.tsx       — Dynamic server-rendered detail (ISR revalidate: 300)
```
Replace `demoJobs` import with `getJobs(searchParams)` Server Action. Remove `generateStaticParams`. Remove `lib/demo-jobs.ts` once live data is connected.

---

## GAP 002 — Job Search and Filtering

**Components:** `job-discovery.tsx`, `hero.tsx`, `explore.tsx`

**Current State**
Client-side filtering over 6 demo jobs. No URL-reflected state. Refreshing the page loses filters.

**Required Production State**
Search state reflected in URL query params. Server-side filtering. Debounced input. Filter counts. Pagination with URL-reflected page param.

**Proposed Implementation**
- `useSearchParams` + `router.replace` for URL state
- Server Action `searchJobs(params: SearchParams)` with Zod-validated input
- `React.use(promise)` + Suspense for streaming results
- Flip animation preserved — capture state before `startTransition`, restore after

---

## GAP 003 — Saved Jobs

**Component:** `job-discovery.tsx`

**Current State**
`saved` is React state. Persists only for the browser session. Users see: "Saved for this preview session. Sign in on ADDOZ to save real jobs."

**Required Production State**
Saved jobs persisted in database, associated with authenticated candidate. Guest save → prompt to sign in, persist post-login. `/saved` route.

**Proposed Implementation**
```
features/candidates/saved-jobs/actions.ts    — saveJob(), unsaveJob(), getSavedJobs()
app/(candidate)/saved/page.tsx               — Authenticated saved jobs page
```
Optimistic UI: update local state immediately, sync to server. Session-layer auth check before save mutation.

---

## GAP 004 — Job Detail Page

**Component:** `app/jobs/[id]/page.tsx`

**Current State**
Statically generated from demo array. Shows prototype banner. Placeholder employer. No salary, deadline, or apply action. Links to WordPress jobs for real opportunities.

**Required Production State**
Dynamic per-job page. Verified employer profile. Apply button. Related roles. Structured data (`application/ld+json` JobPosting schema). `robots: { index: true, follow: true }`.

---

## GAP 005 — Candidate Authentication

**Components:** `site-header.tsx`, `site-footer.tsx`

**Current State**
"Log in" and "Get started" open `addozconsultinglimited.com/#ux-login` and `/#ux-register` in a new tab.

**Required Production State**
Native Next.js authentication. Sign up / sign in. Password reset. Profile: name, headline, location, CV. Authenticated nav state.

**Proposed Implementation**
- **Auth provider:** Better Auth — TypeScript-native, self-hosted, Drizzle adapter, no per-MAU pricing
- Social OAuth: Google (primary), LinkedIn (secondary)
- Email/password with verification + magic link option
- JWT sessions in httpOnly cookies
```
lib/auth/auth.ts            — Better Auth configuration
lib/auth/auth-client.ts     — Client-side auth hooks
app/(auth)/sign-in/page.tsx
app/(auth)/sign-up/page.tsx
```

---

## GAP 006 — Employer Accounts and Job Posting

**Components:** `ecosystem.tsx`, `site-footer.tsx`

**Current State**
"Post a job for free" / "Become an employer" link to WordPress pages.

**Required Production State**
Employer account type. Job posting form. Employer dashboard. Applicant management. Company profile page.

**Proposed Implementation**
```
features/employers/dashboard/
features/employers/job-posting/
features/employers/applicants/
features/companies/[slug]/page.tsx    — Public company profile
```
Role-based auth: `user.role = "candidate" | "employer" | "admin"`.

---

## GAP 007 — AI Career Tools

**Component:** `ecosystem.tsx` (CareerIntelligence)

**Current State**
Three tool cards link to WordPress tools. Note reads: "These tools open on the current ADDOZ platform. Your documents are not uploaded to this preview."

**Required Production State**
- Resume Scanner: CV upload → ATS score + suggestions (OpenAI GPT-4o)
- Interview Prep: Role/JD input → tailored question bank
- Cover Letter: Role + candidate info → draft
- Usage limits by plan (free tier + premium)
- No CV data stored beyond the request unless user opts in

**Proposed Implementation**
```
features/ai/resume-scanner/action.ts    — Server Action: upload CV, call OpenAI, return analysis
features/ai/interview-prep/action.ts
features/ai/cover-letter/action.ts
lib/ai/client.ts                        — OpenAI client singleton
lib/ai/prompts.ts                       — Prompt templates
```
Files via S3/R2 presigned URLs. Rate limiting per user per day.

---

## GAP 008 — Newsletter / Job Alerts

**Component:** `site-footer.tsx` (Newsletter)

**Current State**
Form sets `submitted = true` with no data collection. Status reads: "Prototype form — no emails are collected or sent."

**Required Production State**
Email stored in `job_alerts` table. Verification email on signup. Configurable alert frequency. Job matching against saved search criteria. Unsubscribe flow.

**Proposed Implementation**
```
features/notifications/job-alerts/subscribe.ts    — Server Action
lib/email/client.ts                               — Resend client
lib/email/templates/job-alert.tsx                 — React Email template
```
Transactional email: **Resend** (recommended — React Email integration).

---

## GAP 009 — Testimonials

**Component:** `community.tsx`

**Current State**
Three hardcoded testimonials with illustrative quotes. No photos.

**Required Production State**
Real verified testimonials. Photos with consent. Moderated before publishing.

**Proposed Implementation**
Store in PostgreSQL `testimonials` table. Admin moderation flag. Current hardcoded stories are fallback until live testimonials collected. No fabricated statistics or star ratings.

---

## GAP 010 — Category Exploration

**Component:** `explore.tsx`

**Current State**
Six hardcoded categories. "Explore roles" filters prototype jobs. Locations are hardcoded Lagos LGAs.

**Required Production State**
Categories from live database with job counts. Location data from live jobs. Category landing pages.

**Proposed Implementation**
```
app/jobs/category/[slug]/page.tsx    — Category landing page
```
`getCategories()` and `getLocations()` queries returning live data.

---

## GAP 011 — Page Transition Curtain Initial State

**Component:** `page-transition.tsx`

**Current State**
Curtain may flash at its initial (visible) position before GSAP sets `yPercent: 100`.

**Fix**
Add `style={{ transform: 'translateY(100%)' }}` to the curtain `<div>` as inline initial state.

---

## GAP 012 — Application Flow

**Not yet in prototype.**

**Required Production State**
Multi-step application form. CV upload. Application stored to database. Confirmation email. Employer notification. Application status tracking.

```
features/applications/apply/page.tsx     — Multi-step form
features/applications/apply/action.ts    — Submit Server Action
app/(candidate)/applications/page.tsx    — Candidate application history
```

---

## GAP 013 — Admin / Content Backend

**Not yet in prototype.**

**Required Production State**
Admin dashboard: manage jobs, employers, candidates, testimonials, categories. Moderation queue. Analytics overview.

Build after core candidate and employer flows are stable. Role: `admin` in auth system. Route group: `app/(admin)/admin/`.

---

## PROTOTYPE ELEMENTS TO REMOVE BEFORE PRODUCTION

| Element | Location | Action |
|---|---|---|
| v0 placeholder page.tsx | app/page.tsx | DONE |
| generator: 'v0.app' | app/layout.tsx | DONE |
| MotionGuide dialog | site-footer.tsx | Remove or move to internal docs |
| "Prototype form" label | site-footer.tsx | Replace with real signup |
| INTERACTIVE PREVIEW notice | job-discovery.tsx | Remove when live jobs exist |
| prototype-banner | app/jobs/[id]/page.tsx | Remove when live jobs exist |
| "Saved for this preview session" notice | job-discovery.tsx | Replace with auth save UX |
| tools-note | ecosystem.tsx | Remove when tools are native |
| All sourceSite external links | multiple | Replace with internal routes |
| lib/demo-jobs.ts | lib/ | Remove when live job data is wired |
