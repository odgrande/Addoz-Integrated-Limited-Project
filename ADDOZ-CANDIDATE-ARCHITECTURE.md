# ADDOZ Candidate Application Architecture

**Directive:** 011 — Build the Candidate Application
**Status:** Implemented foundation slice

## Route surface

- `/candidate/dashboard` — authenticated overview
- `/candidate/profile` — profile and location editing
- `/candidate/resume` — resume metadata management
- `/candidate/applications` — application history and status
- `/candidate/saved-jobs` — database-backed saved roles
- `/candidate/job-alerts` — alert creation, pause, and deletion
- `/candidate/notifications` — account notifications and read state
- `/candidate/settings` — account display-name settings

All candidate pages are under the existing candidate route group and shell. `proxy.ts` provides the early request gate; the page data layer and every mutation route independently validate the Better Auth session and require the `candidate` role.

## Data ownership

`features/candidates/queries.ts` is the server-only access layer. Server components use it for reads and derive the candidate profile from `session.user.id`. Client components never receive or submit a candidate ID.

`app/api/candidate/[resource]/route.ts` owns candidate mutations:

- profile updates use the authenticated user and candidate profile
- resume records are scoped to the authenticated candidate profile
- applications resolve a job slug server-side and rely on the unique candidate/job index
- saved jobs resolve a job slug server-side and use the composite primary key
- alerts, notifications, and settings are scoped to the authenticated user/profile

The public job detail experience now uses the same save and application endpoints. Successful applications redirect to `/candidate/applications`; duplicate applications return `409` without creating a second record. Save controls optimistically update and roll back on failure.

## UI and motion

The candidate workspace reuses `DashboardShell`, ADDOZ tokens, buttons, fields, and typography. Candidate-specific styles live in `styles/candidate.css`. The visual language is quieter than the public homepage: warm cream canvas, white work panels, purple focus states, and restrained yellow/orange emphasis.

`CandidateReveal` provides a single page-entry reveal using the existing GSAP motion utilities. Save state uses a small optimistic transition; no workflow-critical mutation depends on animation.

## Known product boundary

Resume storage currently manages metadata (`fileName`, `fileSize`, and `url`). It does not upload binary files. A production storage provider and signed upload flow should be introduced before accepting untrusted file URLs in a live environment.
