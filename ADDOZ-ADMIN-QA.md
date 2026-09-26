# ADDOZ Admin Application QA

**Directive:** 013
**Verification target:** admin authorization, moderation, real-data screens, and protected mutations

## Automated and runtime checks

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed. |
| `pnpm build` | Passed. All requested admin routes and protected APIs compiled. |
| Admin schema migration | Passed. Soft moderation fields and `audit_log` applied with `pnpm db:push`. |
| Controlled admin provisioning | Passed. `pnpm admin:create` provisioned disposable test admins without a public endpoint. |
| Admin access | Passed. Admin login reached `/admin` and `/api/admin/jobs` successfully. |
| Candidate denial | Passed. Candidate `/admin` access redirected with `307`; candidate admin mutation returned `401`. |
| Employer denial | Passed. Employer `/admin` access redirected with `307`. |
| Admin route matrix | Passed. All requested admin pages returned `200` with an admin session. |
| Taxonomy mutation | Passed. Admin created and deactivated a category. |
| Audit logging | Passed. Category creation and deactivation produced audit records. |
| Core data queries | Passed. Dashboard, jobs, applications, users, candidates, employers, companies, categories, and locations query PostgreSQL data. |

## Permission rules

- Every admin page resolves through the protected admin layout.
- Every admin API mutation calls `requireAdmin` server-side.
- Ordinary clients cannot set or escalate roles.
- Admin cannot suspend their own account through the user mutation.
- Referenced category/location rows are deactivated rather than deleted.
- Applications are visible for moderation but stage mutation remains outside admin scope.

## Responsive and accessibility review

The admin CSS includes explicit mobile table conversion below `768px`, wrapped filters, compact metadata, visible focus inherited from the ADDOZ system, semantic table headers, labeled controls, status buttons, loading skeletons, and retryable error states. Review target viewports are `390`, `768`, `1024`, and `1440` pixels. GSAP page reveals are disabled for reduced-motion users.

## Known limitations

Blog, AI telemetry, testimonials, newsletter subscribers, and editable system settings do not have database contracts yet. Their admin pages show truthful empty/configuration states and do not invent records or connect production providers.
