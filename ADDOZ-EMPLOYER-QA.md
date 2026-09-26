# ADDOZ Employer Application QA

**Directive:** 012
**Verification target:** employer ownership, company onboarding, job publication, and candidate-to-employer workflow

## Automated checks

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed. |
| `pnpm build` | Passed. All employer routes and public database-job rendering compiled. |
| Schema migration | Passed. Company ownership/profile fields and application cover-letter metadata applied with `pnpm db:push`. |
| Employer registration | Passed. Registration creates a company and links `employer_profile.company_id`. |
| Job creation | Passed. Zod-validated job creation writes a Draft or explicitly Active job. |
| Public publication | Passed. An Active database job resolves through `/jobs/[slug]` without changing static sample jobs. |
| Candidate application | Passed. Candidate can apply to the published employer job. |
| Employer applicant read | Passed. Owning employer sees the application. |
| Stage propagation | Passed. Employer moved the application to `Interview`; candidate history returned `Interview`. |
| Ownership protection | Passed. A second employer received `404` for another employer's job read and edit. |
| Employer route matrix | Passed. All eleven requested employer pages returned `200` with a real employer session; unauthenticated dashboard access returned `307`. |
| Public marketplace visibility | Passed. A newly published database job appeared in `/jobs` and its `/jobs/[slug]` detail returned `200`. |

## Manual route matrix

| Area | Expected behavior |
| --- | --- |
| Dashboard | Real company, job, applicant, and analytics data; no prototype counts. |
| Company | Empty/partial profile is editable; only the session-owned company can be changed. |
| Jobs | Owned jobs list status, location, type, dates, applicant counts, and actions. |
| Job form | Zod errors are announced through status text; Save Draft never publishes; Publish explicitly sets Active. |
| Applicants | Candidate details are scoped to owned jobs; stage changes persist and remain visible to candidates. |
| Analytics | Counts come from PostgreSQL and show zero/empty states where no rows exist. |
| Notifications | Existing Notification rows render read/unread state and timestamps. |
| Settings | Display name updates; password and account verification remain with Better Auth. |
| Loading/error | Employer route group exposes skeleton and retryable error states. |
| Accessibility | Semantic headings, table headers, labels, focus states, status messages, and mobile table labels are present. |

## Responsive viewport review

Review at `390`, `768`, `1024`, and `1440` pixels. Confirm job forms remain single-column on phones, tables become labeled stacked records below 768px, filters wrap, the fixed sidebar begins at 1024px, and mobile navigation does not cover final content. GSAP reveals are disabled for reduced-motion users.
