# ADDOZ Data Audit

Brief audit of mock data and types across the frontend.

## Mock Data Source Locations
- `lib/demo-jobs.ts`: Demo list of jobs, containing some mock records and types.
- `features/jobs/data.ts`: Exhaustive mock data for jobs, job categories, locations, employers.
- `features/employers/data.ts`: Mock employer data, postings, applicants.
- `features/candidates/data.ts`: Mock candidate data, job alerts, resumes, applications, notifications.
- `features/categories/data.ts`: Mock data for categories.
- `features/locations/data.ts`: Mock data for locations.

## Entities Found in Mocks
- **Job**: Includes title, category, location, company, type, workplace, level, experience, salary min/max, summary, skills, responsibilities, requirements.
- **Company**: Identified by slug in jobs.
- **Employer Posting**: Links to a job, includes metrics (views, applicants, shortlisted), status.
- **Candidate/Applicant**: Name, location, experience, headline, resume.
- **JobAlert**: Saved alerts with filters (keywords, category, location, workplace, frequency).
- **Notification**: Alerts about applications, new jobs, tips.
- **SavedJob**: Just saved job slugs.

These closely align with the entities requested in DIRECTIVE 010.
