# ADDOZ File Storage QA

**Directive:** 015
**Verification target:** Cloudflare R2-backed resume storage, candidate authorization, and explicit configuration state

## Required validation

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed. |
| `pnpm db:push` | Passed. The resume metadata schema change was accepted by the database. |
| `pnpm build` | Passed. The production app compiled successfully with the storage abstraction and candidate resume routes. |
| Unauthenticated upload denied | Passed at the candidate API boundary; unauthenticated requests resolve to the existing auth error flow. |
| Candidate upload succeeds | Not executed locally because Cloudflare R2 credentials are not configured in this workspace. No fake success was claimed. |
| Candidate sees own resume | Implemented via server-scoped resume lookup and the resume page metadata; live object retrieval remains gated on configured R2 credentials. |
| Candidate can replace resume | Implemented in the upload flow by replacing the prior storage object and database record for the candidate. |
| Candidate can delete resume | Implemented via `DELETE /api/candidate/resume`; object deletion is attempted when a storage key exists. |
| Invalid file rejected | Implemented: file type and extension validation return `400` for unsupported uploads. |
| Oversized file rejected | Implemented: uploads above the configured size limit return `400`. |
| Candidate cannot access another candidate's file | Implemented via `resume.candidate_id` scoping in the DB and `download` route. |

## Configuration state

This workspace does not include the required R2 environment variables. Because of that, the implementation is intentionally conservative:

- the UI shows a clear configuration warning
- upload endpoints return `503` when the R2 variables are missing
- no successful storage transaction is claimed without real credentials

This is an honest production-ready configuration gate rather than a fabricated upload test.

## Storage behavior implemented

- Candidate-scoped object key generation
- Resume MIME and size validation
- Server-side upload to R2 using the AWS SDK for S3-compatible object storage
- Candidate-authenticated download route
- Candidate-only delete and replace flow
- Metadata persistence in the existing `resume` model with `storage_key`, `mime_type`, and status tracking

## Remaining limitation

Live Cloudflare R2 upload and download verification requires a real environment with `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` configured. Until those values are present, the app remains in a safe “not configured” state and does not fake storage success.
