# ADDOZ Auth Architecture

## Better Auth Implementation

We use [Better Auth](https://better-auth.com) to handle authentication for the ADDOZ platform, with a Postgres database mapped via Drizzle ORM.

### Key Components

- **Auth Client (`lib/auth-client.ts`)**: Initializes the client SDK for Better Auth, exporting methods like `signIn`, `signUp`, `signOut`, and `useSession`.
- **Auth Configuration (`lib/auth.ts`)**: Server-side configuration connecting Better Auth to the database and enabling specific plugins or methods (e.g., Email & Password).
- **API Route (`app/api/auth/[...all]/route.ts`)**: Next.js route handler to process all Better Auth requests from the client.
- **Proxy (`proxy.ts`)**: Next.js 16 Proxy intercepts protected route requests, validates the Better Auth session in the Node.js runtime, and redirects unauthorized users before route rendering.
- **Registration route (`app/api/register/route.ts`)**: validates candidate/employer registration server-side. Public Better Auth endpoints cannot accept a role value.

### Role-Based Access Control (RBAC)

We use user metadata (`role` field on the User table) to determine user permissions:
- `candidate`: Can access `/candidate/**` routes.
- `employer`: Can access `/employer/**` routes.
- `admin`: Can access `/admin/**`, as well as candidate and employer routes.

Roles are server-owned authorization claims. Better Auth is configured with `input: false` for `role`, so generic sign-up and user-update requests cannot create an admin or alter a role. The dedicated registration route accepts only `candidate` and `employer`; the database enum independently rejects all other values. Every Better Auth sign-up receives a candidate profile through a database hook. Employer registration converts that profile to an employer profile after the server-side role validation.

### Frontend Integration

The login screen uses the typed Better Auth client. The registration screen calls the server-owned registration route; it does not send role data to Better Auth. The client uses `inferAdditionalFields<typeof auth>()` so the role is typed in session data without TypeScript suppressions.

## Foundation Verification — Directive 010.1

- `proxy.ts` is the required Next.js 16 convention; `middleware.ts` is deprecated. It protects `/candidate/**`, `/employer/**`, and `/admin/**`.
- Proxy obtains the session through `auth.api.getSession({ headers: request.headers })`, not an internal HTTP loop. It is an early request guard only; future protected Server Actions and Route Handlers must independently validate session and role.
- Candidate, employer, admin, and unauthenticated browser flows require a configured development database for end-to-end verification. No development `DATABASE_URL` was present during this audit, so those flows remain unexecuted rather than assumed successful.
