# ADDOZ Production Marketplace Architecture

**Directive:** 014 — Production Job Marketplace & Discovery
**Status:** Implemented and verified

## Query architecture

`features/jobs/public-data.ts` is the server-only marketplace query layer. It joins `job`, `company`, `category`, and `location`, and applies the publication contract at the database boundary:

- `job.status = 'Active'`
- `company.active = true`
- `category.active = true`
- `location.active = true`

The `/jobs` server page parses URL parameters, calls `searchMarketplace`, and sends only the current page of database records to the existing `JobsBrowser` component. The browser never receives the full jobs table. The existing visual controls, URL transitions, pagination component, cards, and GSAP behavior remain in place.

The public category and location detail pages follow the same pattern: they resolve a taxonomy slug, call `searchMarketplace({ category: slug })` or `searchMarketplace({ location: slug })`, and render the live result set inside the existing category/location detail presentation without introducing a second public jobs source.

Supported query parameters include `q`, `category`, `location`, `type`, `workplace`, `experience`, `salary`, `sort`, and `page`. Search matches job title, company name, and job summary. Newest ordering is database-backed; relevance currently uses newest ordering when a keyword is supplied because no search ranking extension is introduced.

## Detail and related jobs

`/jobs/[slug]` is dynamic and resolves only through `getPublicJob`. Static job data is no longer a public detail fallback. The existing sample catalog is synchronized into PostgreSQL by the idempotent seed script so the current sample experience remains available without a second runtime source of truth.

Detail pages include the existing job presentation, company/category/location metadata, salary, skills, candidate apply/save controls, and database-backed related active jobs sharing category or location.

## Publication state

Employer job creation defaults to `Draft`. The employer publishing source of truth is the existing `job.status` field. Only `Active` jobs enter public search and detail queries, including the category and location discovery pages. `Paused`, `Closed`, `Archived`, and `Draft` jobs are excluded automatically across `/jobs`, `/jobs/[slug]`, `/categories/[slug]`, and `/locations/[slug]`. Admin moderation uses the same status field, so no duplicate publication logic exists.

## Candidate integration

The existing candidate API remains responsible for saves and applications. It resolves candidate identity from Better Auth session headers, resolves jobs by database slug, rejects inactive jobs, uses the existing unique candidate/job constraint, and returns `409` for duplicate applications. Unauthenticated save/apply requests continue through the existing login flow or return `401` at the API boundary.

## Taxonomy

Marketplace category and location filters come from the PostgreSQL `category` and `location` tables. The seed synchronizes the existing public taxonomy into those tables without introducing a second taxonomy model. Inactive taxonomy records are not used by public joins.

## Indexes and performance

The schema includes indexes for `job.status`, `job.category_id`, `job.location_id`, and `job.created_at`, plus active flags on companies, categories, and locations. Slugs were already unique and remain indexed through unique constraints. Search remains PostgreSQL `ILIKE` over the practical text fields; no external search service is introduced.

## Security considerations

Public queries return only active/published records. Employer ownership remains enforced by the employer APIs. Candidate mutations remain session-scoped. Admin moderation remains server-authorized. Public job detail does not expose drafts or inactive jobs even when a slug is known.
