# ADDOZ Security Foundation

## Core Principles

The security of the ADDOZ platform is built on modern standards, prioritizing zero-trust architecture, robust access control, and secure data handling.

## Authentication & Authorization

- **Session Management**: We use Better Auth for secure session management. Sessions are strictly tied to the user and validated across all protected edges.
- **Protected Routes**: Next.js 16 `proxy.ts` is the early request guard for `/candidate/**`, `/employer/**`, and `/admin/**`. It validates the Better Auth session directly in the Node.js runtime and redirects unauthenticated or unauthorized requests before route rendering.
- **Roles**: Distinct roles (`candidate`, `employer`, `admin`) govern data visibility and access to specific route branches. The role is a database enum and is server-owned (`input: false` in Better Auth). Public registration accepts only candidate or employer, so an admin cannot self-assign.

## Data Security

- **Database Protection**: Drizzle ORM provides a secure interface to PostgreSQL, mitigating SQL injection risks.
- **Environment Variables**: Sensitive tokens, database URLs, and API keys are stored in `.env.local` and exposed only to the server context, never to the client.

## Error Handling & UX

Authentication errors (e.g., duplicate email, invalid credentials) are caught by the Better Auth client and presented clearly to the user without leaking sensitive backend details. This balance ensures good UX without sacrificing security.

## Foundation Verification — Directive 010.1

- Better Auth role input is blocked on its public endpoints. The only public registration endpoint validates a strict candidate/employer allow-list on the server.
- User email has a unique database constraint. Saved jobs use a composite primary key and applications use a unique `(candidate_id, job_id)` index, preventing duplicates under concurrent requests.
- Secrets remain server-only: `DATABASE_URL` and `BETTER_AUTH_SECRET` are unprefixed environment variables and are not imported by client components. `NEXT_PUBLIC_APP_URL` is the only auth client configuration value exposed to the browser.
- Existing foreign keys intentionally use PostgreSQL's restrictive `NO ACTION` deletion behaviour. Deletion workflows must explicitly remove dependent data; they must not assume cascading deletes.
- Proxy is not the sole authorization boundary. Every future protected Server Action, Route Handler, and data query must validate session and role server-side.
