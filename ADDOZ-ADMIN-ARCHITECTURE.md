# ADDOZ Admin Application Architecture

**Directive:** 013 — Build the Admin Application
**Status:** Implemented and runtime verified

## Access model

Admin access requires an authenticated Better Auth session with `session.user.role === "admin"`. The existing proxy blocks non-admin browser requests early, while the admin layout and every admin route handler independently call `requireAdmin` from `features/admin/queries.ts`.

Public registration accepts only `candidate` and `employer`. Admin provisioning is CLI-only through `pnpm admin:create`, which runs `scripts/create-admin.ts` on the server environment. It can promote an existing account or create a new account when `ADMIN_EMAIL`, `ADMIN_NAME`, and, for new accounts, `ADMIN_PASSWORD` are supplied. There is no public admin-creation endpoint and no client-controlled role mutation.

## Routes and data

Core real-data surfaces:

- `/admin` — aggregate user, job, application, company, and audit counts
- `/admin/jobs` — job search and moderation state
- `/admin/applications` — support visibility across candidates, jobs, and employers
- `/admin/users` — role inspection and suspend/reactivate action
- `/admin/candidates` — profile completion, resume presence, and application counts
- `/admin/employers` — company, job, applicant, and account status
- `/admin/companies` — company search, job counts, and soft active/inactive moderation
- `/admin/categories` and `/admin/locations` — create, edit name, and soft deactivate taxonomy records

The admin query layer joins the existing PostgreSQL/Drizzle entities and does not use prototype metrics.

Content-domain routes intentionally show honest empty/configuration states:

- `/admin/blog` — public blog is static; no blog table exists
- `/admin/ai-tools` — no AI telemetry table or production provider exists
- `/admin/testimonials` — testimonials are static; no moderation table exists
- `/admin/newsletter` — no subscriber table or delivery system exists
- `/admin/settings` — no editable system settings exist beyond environment-managed configuration

## Mutations and security

Admin mutations live under `app/api/admin`. They derive the actor from the Better Auth request headers and never trust role, user, company, or job identity supplied by the client.

- Job moderation updates only the requested database job and records an audit event.
- User mutations only suspend/reactivate accounts; role escalation is not exposed.
- Company moderation changes only the requested company and records an audit event.
- Category/location mutations use soft `active` flags so referenced rows are not deleted.
- Application pages are intentionally read-only; application stage manipulation remains owned by the employer workflow.

## Audit logging decision

An audit log is justified because job moderation, account suspension, company moderation, and taxonomy changes affect public visibility or access. `audit_log` records the authenticated actor, action, entity type/id, optional JSON metadata, and timestamp. It is deliberately small: no generalized event bus or analytics pipeline is introduced yet.

## UI

The dedicated admin experience uses the existing `DashboardShell`, ADDOZ tokens, tables, filters, responsive stacked mobile rows, status badges, empty states, and restrained GSAP page reveals. Admin pages are operational and dense rather than expressive marketing surfaces. Loading/error states live at the admin route-group boundary.
