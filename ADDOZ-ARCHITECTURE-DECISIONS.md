# ADDOZ — Architecture Decision Record

**Directive:** 002
**Date:** 2026-09-22
**Status:** Active — reviewed at start of each build phase

---

## ADR 001 — Why This Is Not Headless WordPress

**Decision:** ADDOZ will be a fully custom Next.js application, not a headless WordPress frontend.

**Why headless WordPress was rejected**
WordPress was not designed as an application platform. A recruitment platform requires custom auth with role-based access, transactional workflows (applications, hiring pipeline, job alerts), dynamic relational data, real-time elements, secure file handling, and AI API integration. Attempting to build these on WordPress + WP REST API produces custom plugins for every feature, ACF/CPT hacks for relational data, rate limits, and tight coupling to WP auth.

The WordPress site is retained at `addozconsultinglimited.com` as a redirect target and content reference during the transition. Once the production platform launches, it is decommissioned.

---

## ADR 002 — Why ADDOZ Is a Custom Application

**Decision:** ADDOZ is built from scratch as a purpose-built recruitment application.

Existing SaaS platforms (Workable, Greenhouse, SmartRecruiters) impose vendor branding and UI constraints that conflict with ADDOZ's editorial design direction, per-seat or per-job pricing that caps growth, no GSAP control, and no AI integration at the product layer.

ADDOZ's competitive advantage is the experience: the editorial design, the motion quality, the AI-powered career tools, and the trust it builds with Nigerian talent. A custom application owns every pixel and every millisecond of that experience.

---

## ADR 003 — Why the First Architecture Is a Modular Monolith

**Decision:** Next.js modular monolith. Not microservices.

**Arguments against microservices at this stage**
- Network latency between services adds complexity with no benefit at low traffic
- Each service needs its own deployment, monitoring, secrets, and CI pipeline
- Distributed transactions require saga patterns that add weeks of engineering
- Team is small — operational overhead exceeds available engineering bandwidth

**Modular monolith approach**
Separate the codebase into clearly bounded feature modules (`features/jobs`, `features/candidates`, `features/employers`, `features/applications`, `features/ai`) that could be extracted into services when scale demands. Each module owns its database queries, server actions, and UI components.

**When to revisit**
Extract a service when: (a) a module needs to scale independently due to load; (b) a module needs a different runtime (e.g. Python ML service for CV parsing); (c) the team exceeds ~8 engineers and ownership conflicts arise.

---

## ADR 004 — Frontend Strategy

**Decision:** Next.js 15+ (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, GSAP.

| Concern | Decision | Reason |
|---|---|---|
| Framework | Next.js App Router | SSR for SEO-critical job pages; RSC for data-fetching; file-based routing |
| Language | TypeScript | Type-safe DB queries, validated API inputs, safer Server Actions |
| Styling | Tailwind CSS v4 | Utility-first, co-located, excellent tree-shaking |
| Components | shadcn/ui (Base UI) | Unstyled, accessible primitives; full design control |
| Typography | Plus Jakarta Sans | Already in prototype; humanist, strong weight range for editorial type |
| Animation | GSAP + @gsap/react | SplitText, ScrollTrigger, Flip already implemented and working |
| Fonts | next/font/google | Self-hosted, display: 'swap' prevents FOIT |

**GSAP Architecture Principles (preserved from prototype)**
- All GSAP code in `"use client"` components only
- `lib/motion.ts` is the single plugin registration point — one `gsap.registerPlugin()` call in the entire app
- All animations use `useGSAP` with `scope: root` for automatic cleanup
- `gsap.matchMedia()` gates all animations — `prefers-reduced-motion` respected everywhere
- No scroll hijacking; no scroll-dependent interaction that blocks content
- Magnetic effects: pointer-only, guarded by `(hover: hover) and (pointer: fine)`

Motion principles:
```
Hero:               SplitText + timeline (word masks)
Job filtering:      Flip (position capture before React commits)
Category explore:   Flip (accordion expand)
Career story:       ScrollTrigger + timeline (desktop-pinned, 3-step)
Career tools:       ScrollTrigger (reveal group)
Page navigation:    GSAP curtain transition
Buttons (CTA):      Magnetic micro-interaction (pointer-only)
Ticker:             Continuous GSAP tween with accessible pause
```

---

## ADR 005 — Database Strategy

**Decision:** PostgreSQL, managed via Drizzle ORM.

| Concern | Decision | Reason |
|---|---|---|
| Database | PostgreSQL | Mature, relational, excellent full-text search, JSON support |
| ORM | Drizzle | TypeScript-native, query builder, minimal abstraction, schema-first migrations |
| Hosting | Neon (serverless PostgreSQL) | Zero-config Vercel integration, scales to zero in dev |
| Migrations | Drizzle Kit | `drizzle-kit generate` + `drizzle-kit migrate` |
| Validation | Zod | All Server Action inputs validated before hitting the database |

**Why not Prisma?** Generates a query engine binary, adds startup latency in serverless environments, less precise types for complex joins.

**When to introduce caching/search infrastructure**
- Add Redis (Upstash) when job listing pages need sub-50ms response at high load — not now
- Add Meilisearch when full-text search requires typo tolerance and sub-10ms results — PostgreSQL `tsvector` is sufficient for the first 10,000–50,000 jobs

---

## ADR 006 — Authentication Strategy

**Decision:** Better Auth with PostgreSQL session storage.

| Option | Decision |
|---|---|
| Clerk | Rejected — per-MAU pricing, vendor lock-in, opaque auth UI |
| Auth.js (NextAuth) | Rejected — leaky session abstraction, verbose adapter pattern |
| Supabase Auth | Rejected — requires Supabase database, conflates auth and database vendor |
| Better Auth | **Selected** — TypeScript-native, self-hosted, Drizzle adapter, no per-user pricing |

**Configuration**
- Email/password with email verification
- Google OAuth (primary — most ADDOZ candidates have Google accounts)
- LinkedIn OAuth (secondary — relevant for professional profiles)
- Magic link option
- Sessions in PostgreSQL via Drizzle adapter, httpOnly cookies
- Roles: `candidate`, `employer`, `admin` on user record

---

## ADR 007 — File Storage Strategy

**Decision:** S3-compatible object storage via Cloudflare R2.

Use cases: candidate CV uploads, employer company logos, editorial photography.

R2 is S3-compatible with zero egress fees. Uses `@aws-sdk/client-s3` — same code works against any S3-compatible service.

- CV path pattern: `cvs/{userId}/{timestamp}-{filename}`
- Presigned upload URLs generated server-side — client never has storage credentials
- Public read for logos; private + presigned for CVs
- Virus scanning before accepting CV files
- CVs not stored beyond 90 days without explicit user opt-in

---

## ADR 008 — Search Strategy

**Decision:** PostgreSQL full-text search at launch; Meilisearch when justified by scale.

**Phase 1 (launch)**
- `tsvector` columns on `jobs` table (title, description, skills, category)
- GIN index on combined tsvector
- `plainto_tsquery` for user search input
- `ts_rank` for result ranking
- Adequate for first 10,000–50,000 jobs

**Phase 2 (when justified)**
Meilisearch for typo tolerance, faceted filtering, sub-10ms results.

---

## ADR 009 — AI Integration Strategy

**Decision:** OpenAI GPT-4o via Server Actions. Direct API integration.

- `openai` npm package, called from Server Actions only — API key stays on server
- Streaming responses via `ReadableStream`
- Model: `gpt-4o` for quality; `gpt-4o-mini` as cost tier
- Prompt templates in `lib/ai/prompts.ts` — versioned and testable
- Rate limiting: 10 free tool calls/day, unlimited on premium
- No permanent CV storage beyond the request unless user opts in

---

## ADR 010 — Notification Strategy

**Decision:** Transactional email via Resend + React Email. No real-time WebSockets at launch.

- All transactional emails: verification, password reset, job alert, application confirmation
- React Email templates — same component model as the UI
- Sender domain: verified ADDOZ domain (SPF/DKIM required)
- Job alerts: scheduled worker matches new jobs to subscriptions daily/weekly
- In-app notifications: `notifications` DB table + polling or SSE — defer until needed
- WebSockets (Pusher/Ably) only if real-time is a stated requirement

---

## ADR 011 — Content Management Strategy

**Decision:** No CMS at launch. PostgreSQL for structured content; editorial copy in code.

ADDOZ's editorial copy changes infrequently. A CMS adds a new vendor dependency before the core product is stable. Hardcoding copy in components allows co-located design and content iteration.

**When to add a CMS**
When non-developer editors need to update copy, categories, blog posts, or employer landing pages. Recommended: **Payload CMS** — TypeScript-native, self-hosted, PostgreSQL-backed, no separate database vendor.

---

## ADR 012 — Deployment Direction

**Decision:** Vercel for production. Neon for PostgreSQL. Cloudflare R2 for storage. Resend for email.

| Layer | Service |
|---|---|
| Frontend + API | Vercel |
| Database | Neon (PostgreSQL) |
| File storage | Cloudflare R2 |
| Transactional email | Resend |
| Analytics | GA4 |
| Error monitoring | Sentry |
| Search (Phase 2) | Meilisearch Cloud |
| AI | OpenAI API |
| Auth | Better Auth (self-hosted in app) |

**CI/CD**
- GitHub repository (private)
- Vercel Git integration: `main` → production; PRs → preview deploys
- Drizzle Kit migrations as post-deploy step, not in build
- Environment variables via Vercel, not `.env` in production

---

## ADR 013 — Recommended Production Folder Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx                  # Homepage
│   ├── jobs/
│   │   ├── page.tsx                  # Job search/listing
│   │   ├── category/[slug]/page.tsx  # Category pages
│   │   └── [id]/
│   │       ├── page.tsx              # Job detail
│   │       └── apply/page.tsx        # Application form
│   ├── employers/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx           # Company profile
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── verify/page.tsx
│   ├── (candidate)/
│   │   ├── dashboard/page.tsx
│   │   ├── saved/page.tsx
│   │   ├── applications/page.tsx
│   │   └── profile/page.tsx
│   ├── (employer)/
│   │   ├── dashboard/page.tsx
│   │   ├── jobs/page.tsx
│   │   └── applicants/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   ├── api/
│   ├── layout.tsx
│   ├── globals.css                   # Tailwind + ADDOZ design system
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/
│   ├── addoz/                        # ADDOZ-branded components (keep existing)
│   │   ├── hero.tsx
│   │   ├── homepage.tsx
│   │   ├── job-discovery.tsx
│   │   ├── explore.tsx
│   │   ├── career-journey.tsx
│   │   ├── ecosystem.tsx
│   │   ├── community.tsx
│   │   ├── site-footer.tsx
│   │   ├── site-header.tsx
│   │   └── page-transition.tsx
│   └── ui/                           # shadcn/Base UI primitives (keep existing)
│
├── features/
│   ├── jobs/
│   │   ├── actions.ts                # getJobs, getJobById, searchJobs
│   │   ├── types.ts                  # Zod schemas
│   │   └── components/
│   ├── candidates/
│   │   ├── actions.ts
│   │   ├── saved-jobs/
│   │   └── profile/
│   ├── employers/
│   │   ├── actions.ts
│   │   └── job-posting/
│   ├── applications/
│   │   └── actions.ts
│   ├── companies/
│   │   └── actions.ts
│   └── ai/
│       ├── resume-scanner/
│       ├── interview-prep/
│       └── cover-letter/
│
├── lib/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── jobs.ts
│   │   │   ├── companies.ts
│   │   │   ├── applications.ts
│   │   │   ├── saved-jobs.ts
│   │   │   └── job-alerts.ts
│   │   ├── index.ts                  # Drizzle client
│   │   └── migrations/
│   ├── auth/
│   │   ├── auth.ts                   # Better Auth configuration
│   │   └── auth-client.ts
│   ├── ai/
│   │   ├── client.ts                 # OpenAI client
│   │   └── prompts.ts
│   ├── email/
│   │   ├── client.ts                 # Resend client
│   │   └── templates/
│   ├── storage/
│   │   └── r2.ts                     # Cloudflare R2 (S3-compatible)
│   ├── animations/
│   │   ├── motion.ts                 # GSAP registration + reducedMotion
│   │   └── variants.ts               # Shared animation configs
│   └── utils.ts
│
└── middleware.ts                      # Auth guards + security headers
```

**Key rules**
- `features/` modules do NOT import from each other — cross-feature data goes via `lib/db/`
- `components/addoz/` stays flat until component count justifies sub-directories
- `middleware.ts` guards `(candidate)/`, `(employer)/`, and `(admin)/` route groups
- `lib/animations/` replaces `lib/motion.ts` when a second animation utility exists
