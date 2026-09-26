# ADDOZ Employer Application Architecture

**Directive:** 012 — Build the Employer Application
**Status:** Implemented foundation slice

## Routes

- `/employer/dashboard` — company overview, job and applicant counts, attention list
- `/employer/profile` — authenticated employer contact profile
- `/employer/company` — owned company onboarding and editing
- `/employer/jobs` — owned job list and controls
- `/employer/jobs/new` — validated draft/publish creation
- `/employer/jobs/[id]/edit` — owned job editing
- `/employer/jobs/[id]/applicants` — applicants for one owned job
- `/employer/applicants` — owned applicants across all jobs
- `/employer/analytics` — real counts by job and stage
- `/employer/notifications` — persisted account notifications
- `/employer/settings` — account display name and Better Auth boundary

## Ownership model

Employer registration creates the Better Auth user, a company from `companyName`, and an `employer_profile` pointing to that company. An employer manages exactly the company referenced by their own `employer_profile.company_id`.

Jobs do not accept an owner ID from the client. A job belongs to the authenticated employer when its `company_id` matches the company resolved from the session. Every employer job read, edit, state change, archive, applicant read, and application stage update applies this server-side check.

There are no multi-company teams in this slice. `company_id` is intentionally one-to-one through the employer profile until team permissions are designed explicitly.

## Data access

`features/employers/queries.ts` is server-only. It resolves the session, employer profile, company, jobs, applicants, notification records, and analytics aggregates. `app/api/employer/[resource]/route.ts` owns company, profile, job creation, notification, and settings mutations. Job-specific ownership is enforced by `app/api/employer/jobs/[id]/route.ts`; application stages are enforced by `app/api/employer/applications/[id]/route.ts`.

New jobs default to `Draft`. Publishing sets `Active`, assigns a publication timestamp, and makes the job available to the public job detail adapter in `features/jobs/public-data.ts`. Static sample jobs remain available through the existing public data module and remain marked as samples.

## Applicant permissions

Employers see the candidate name, headline, experience, location, application date, stage, resume metadata/link, and optional cover letter for applications attached to their own jobs. Candidate IDs and employer IDs are not accepted as authorization inputs. Candidate access remains governed by the existing candidate session and profile path.

## Security assumptions

- Better Auth remains the source of session identity and role.
- Proxy is an early gate; route handlers still verify role and ownership.
- Database foreign keys and unique indexes protect application integrity.
- Job status is checked when candidates apply.
- Resume URLs are metadata in this prototype and should move behind signed storage before production file handling.
