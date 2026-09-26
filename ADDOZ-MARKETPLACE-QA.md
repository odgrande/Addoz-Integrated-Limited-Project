# ADDOZ Marketplace QA

**Directive:** 014
**Verification target:** PostgreSQL-backed public search, detail, publication state, and candidate integration

## Required validation

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed. |
| `pnpm build` | Passed. `/jobs` and `/jobs/[slug]` are dynamic database-backed routes. |
| `pnpm db:push` | Passed. Marketplace indexes and schema state applied. |
| Catalog seed | Passed. Existing sample catalog synchronized into PostgreSQL. |
| Public `/jobs` | Passed — `200`. |
| Category discovery page | Passed — `/categories/[slug]` rendered live jobs from the marketplace query layer. |
| Location discovery page | Passed — `/locations/[slug]` rendered live jobs from the marketplace query layer. |
| Keyword search | Passed — `/jobs?q=frontend` returned `200`. |
| Combined filters | Passed — category, location, employment type, and page query returned `200`. |
| Pagination | Passed through URL-driven `page` query and server offset/limit. |
| No-results state | Passed — unknown keyword returned `200` with the existing empty state. |
| Job detail by slug | Passed — active database job returned `200`. |
| Draft inaccessible | Passed — draft job detail returned `404`. |
| Published job visible | Passed — active employer job appeared in `/jobs`, `/categories/[slug]`, `/locations/[slug]`, and detail returned `200`. |
| Paused job inaccessible | Passed — paused detail returned `404`, and paused jobs were omitted from public discovery. |
| Closed job inaccessible | Passed — closed detail returned `404`, and closed jobs were omitted from public discovery. |
| Archived job inaccessible | Passed — archived detail returned `404`, and archived jobs were omitted from public discovery. |
| Candidate save | Passed — authenticated save returned `201`. |
| Candidate unsave | Passed — authenticated unsave returned `200`. |
| Candidate apply | Passed — authenticated apply returned `201`. |
| Duplicate application | Passed — second apply returned `409`. |
| Unauthenticated application | Passed — API returned `401`; existing public auth flow remains available. |
| Candidate regression | Passed — unauthenticated `/candidate/dashboard` remained protected with `307`; candidate API duplicate protection remained functional. |
| Employer regression | Passed — unauthenticated `/employer/dashboard` remained protected with `307`; ownership and publication APIs remained functional. |
| Admin regression | Passed — unauthenticated `/admin` remained protected with `307`; admin application/build remained intact. |
| Public homepage regression | Passed — `/` returned `200`. |

## Responsive and accessibility review

The existing marketplace component and design system were preserved. The server data change does not alter the established responsive layouts, mobile filter sheet, focus styles, semantic controls, or reduced-motion GSAP behavior. Review target viewports remain `390`, `768`, `1024`, and `1440` pixels.

## Remaining limitations

- Keyword relevance uses newest ordering when a query is present; PostgreSQL full-text ranking is not introduced.
- Search uses `ILIKE` over title, company name, and summary. A dedicated search vector/index can be added later if scale requires it.
- The category and location detail pages now use the same live database marketplace query layer as the jobs index, while preserving the existing presentation and interaction patterns.
