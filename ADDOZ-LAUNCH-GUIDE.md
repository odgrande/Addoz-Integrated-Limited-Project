# ADDOZ — Launch Guide

How to take ADDOZ live, what is included, every useful URL, and how to run it day to day.

---

## 1. What ADDOZ includes at launch

### Public site (no account needed)
| Area | URL | What it does |
|---|---|---|
| Home | `/` | Hero, newest live roles, explore by category/location, employer + career-tools sections, newsletter |
| Jobs | `/jobs` | Search + filters (keyword, category, location, type, workplace, experience, salary), pagination |
| Job detail | `/jobs/{slug}` | Full role, company, apply, save, share, related roles |
| Companies | `/companies`, `/companies/{slug}` | Every company with live roles, its profile and open roles |
| Categories | `/categories`, `/categories/{slug}` | All categories with live role counts |
| Locations | `/locations`, `/locations/{slug}` | Lagos + Ogun areas with live role counts |
| For employers | `/for-employers` | Employer proposition; "Post a job" → employer sign-up → job form |
| Career tools | `/career-tools`, `/career-tools/resume-scanner`, `/career-tools/cover-letter`, `/career-tools/interview-prep` | Instant in-browser checks (AI analysis: next release) |
| Content | `/about`, `/contact`, `/faq`, `/blog`, `/privacy`, `/terms` | Contact form is stored + forwarded; blog shows "coming soon" until articles are added |
| SEO | `/sitemap.xml`, `/robots.txt` | Generated from live jobs, companies, categories, locations |

### Accounts and sign-in
| Flow | URL |
|---|---|
| Candidate sign in / register | `/auth/login`, `/auth/register` |
| Employer sign in / register | `/auth/login?role=employer`, `/auth/register?role=employer` |
| Admin sign in | `/auth/admin/login` (visiting `/admin` signed out redirects here) |
| Email verification (6-digit OTP) | `/auth/verify` — code emailed on registration and on any unverified sign-in |
| Forgot / reset password | `/auth/forgot-password` → emailed link → `/auth/reset-password` |

Rules: every account verifies its email with a one-time code before it can sign in. Roles are server-controlled; candidates, employers and admins each only reach their own area.

### Applying for jobs
- **Signed-in candidates**: apply with a new CV or the CV on their profile, review, consent, submit. The job then shows **Applied** everywhere, permanently.
- **Guests**: apply with name, email, phone (optional), cover note and **CV (required)**. ADDOZ silently creates a passwordless candidate account for that email so all their applications stay together. They open it any time with **Forgot password** using the same email.
- CVs: PDF, DOC, DOCX, RTF or TXT, up to 4 MB. Each application keeps its own copy of the CV.
- Duplicate applications are blocked (one per person per job). Paused/closed jobs can't be applied to.

### Candidate workspace — `/candidate/...`
`dashboard`, `applications` (status of every application + message the employer), `messages`, `saved-jobs`, `job-alerts`, `profile`, `resume`, `notifications`, `settings`.

### Employer workspace — `/employer/...`
`dashboard`, `jobs` (draft / publish → **in review** → live / pause / archive; declined jobs show ADDOZ's reason with "Edit & resubmit"), `jobs/new`, `jobs/{id}/edit`, `jobs/{id}/applicants` (CV download, email, phone, cover note, stage, message), `applicants`, `messages`, `analytics`, `company`, `profile`, `notifications`, `settings`.

### Admin workspace ("god mode") — `/admin/...`
- **Job approvals** — `/admin/jobs?status=Pending`: every new job waits here. **Approve** (goes live, employer emailed) or **Decline** with a reason (employer emailed, sees the reason, can edit and resubmit). Also **Pause**, **Archive**, **Restore**, and **Delete permanently** (type `DELETE`). Once approved, an employer can pause and re-publish without another review.
- **Ghost mode** — open any job page in any status (pending, draft, paused, declined) with a "Preview — not public" banner. The owning employer can preview their own jobs too; the public only sees approved, live jobs.
- **People** — `/admin/users`, `/admin/candidates`, `/admin/employers`: **Suspend** (with optional reason — blocks sign-in and signs them out everywhere), **Reactivate**, **Delete permanently** (type `DELETE`; removes profile, applications, CVs, saves, alerts, messages, notifications — an employer who is the last account on a company also hides the company and archives its jobs), **Message**. Admin accounts can't be suspended or deleted from here.
- **Marketplace** — `applications` (every application), `companies` (show/hide), `categories`, `locations`.
- **Inbox** — `messages`: every support thread, plus every employer↔candidate thread read-only for moderation.
- **Audience** — `newsletter`: subscribers and contact-form messages.
- Every admin action is written to the audit log.

### Notifications (in-app + email)
| Event | Who hears |
|---|---|
| Application submitted | Candidate (confirmation) and the company's employer accounts (new applicant) |
| Application stage changed | Candidate |
| Job submitted for review | Admins |
| Job approved / declined | The company's employer accounts |
| New message | The other side of the conversation |
| Registration / unverified sign-in | Account owner (6-digit code) |
| Password reset | Account owner (link, 1 hour) |

### Messaging
- **Employer ↔ candidate**, one thread per application ("Message" on the applicants list, "Message employer" on the candidate's applications).
- **Candidate/employer ↔ ADDOZ team**: "Contact ADDOZ" in any inbox. Admins reply as "ADDOZ team" and can start a conversation with any user from **Users**.

---

## 2. Services (all free to start)

| Need | Service | Free tier | Notes |
|---|---|---|---|
| Hosting | **Vercel** | Hobby: free | Hobby is for non-commercial use; move to **Pro ($20/month)** when ADDOZ earns revenue. Not GitHub Pages — it only serves static files and can't run sign-in, the database or uploads. |
| Database | **Neon** (already set up) | 0.5 GB | Pick the Vercel region closest to your Neon region (e.g. both in Frankfurt / `eu-central-1`) — this is the single biggest speed factor. |
| Email | **Brevo** | 300 emails/day | Only needs one verified sender address. Upgrade later or switch to Resend with your own domain. |
| CV files | **Database** (automatic) or **Cloudflare R2** | Neon space / R2: 10 GB | With no R2 keys, CVs are stored in the database automatically. Add R2 later (needs a card on file, but free up to 10 GB) — just set the keys, nothing else changes. |
| Domain | Your registrar | — | Point it at Vercel (step 3.6). |

---

## 3. Go-live steps

### 3.1 Email — Brevo (10 minutes)
1. Create a free account at **brevo.com**.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: use the address ADDOZ will send from (e.g. `addozng@gmail.com`, or `no-reply@yourdomain` once you have one) and click the verification link Brevo emails you.
3. **SMTP & API → API Keys → Generate a new API key**. Copy it.
4. You'll set `BREVO_API_KEY` and `EMAIL_FROM="ADDOZ <that-address>"` in Vercel (3.4).

Tip: sending from a Gmail address works, but some messages may land in spam. When you have a domain, verify it in Brevo (adds DNS records) and switch `EMAIL_FROM` to `no-reply@yourdomain`.

### 3.2 Database update (one time)
In the project folder run:
```
pnpm db:push
```
It adds the remaining tables (file storage). Safe to re-run; it never deletes data.

### 3.3 Start fresh
Removes all test accounts and data, keeping only the admin in `ADMIN_EMAIL`:
```
pnpm launch:reset            # dry run — shows what would be deleted
pnpm launch:reset --confirm  # deletes everything except that admin
```

### 3.4 Deploy to Vercel
1. Push the project to a **private GitHub repository**.
2. **vercel.com → Add New → Project → Import** that repository (framework: Next.js, defaults are fine).
3. **Settings → Environment Variables** (Production):

| Variable | Value |
|---|---|
| `DATABASE_URL` | your Neon connection string (same as `.env.local`) |
| `BETTER_AUTH_SECRET` | a new long random string (`openssl rand -base64 32`) — **don't reuse the dev one** |
| `BETTER_AUTH_URL` | `https://your-domain` (or the `*.vercel.app` URL until the domain is connected) |
| `NEXT_PUBLIC_APP_URL` | same as `BETTER_AUTH_URL` |
| `GUEST_APP_SECRET` | another random string |
| `BREVO_API_KEY` | from 3.1 |
| `EMAIL_FROM` | `ADDOZ <your-verified-sender>` |
| `CONTACT_EMAIL` | inbox for contact-form messages (optional; defaults to the site email) |
| `ADMIN_EMAIL` | your admin email |
| `AUTH_ALLOWED_HOSTS` | `www.your-domain` if you serve both `your-domain` and `www` |
| `R2_*` | optional — only when you move CVs to Cloudflare R2 |

4. **Settings → Functions → Region**: choose the region nearest your Neon database.
5. **Deploy**.

### 3.5 First checks on the live URL (15 minutes)
- [ ] `/admin` → admin sign-in → overview loads.
- [ ] Register a real candidate with your own email → the 6-digit code arrives → you land on the dashboard.
- [ ] Register an employer (different email) → verify → post a job → it shows **In review** → approve it in `/admin/jobs?status=Pending` → it appears on `/jobs`, its category, location and company pages.
- [ ] As the candidate, apply with a CV → both inboxes get emails → employer sees the applicant and downloads the CV.
- [ ] Employer moves the stage to "Shortlisted" → candidate gets the update email.
- [ ] Employer messages the candidate → candidate replies → both see the thread.
- [ ] Sign out, apply to another job as a guest → confirmation email → **Forgot password** with that email → set password → applications visible.
- [ ] Contact form and newsletter → visible in `/admin/newsletter`.
- [ ] Repeat a few pages on your phone.

### 3.6 Connect the domain
1. Vercel → **Project → Settings → Domains → Add** `your-domain` and `www.your-domain`.
2. At your registrar, add the DNS records Vercel shows (an `A` record for the apex, a `CNAME` for `www`).
3. When the domain shows **Valid**, update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://your-domain`, add the other host to `AUTH_ALLOWED_HOSTS`, and **redeploy**.
4. In Brevo, verify the domain and switch `EMAIL_FROM` to an address on it.
5. Submit `https://your-domain/sitemap.xml` in Google Search Console.

---

## 4. Day-to-day operations

| Task | How |
|---|---|
| Add another admin | Set `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` in `.env.local`, run `pnpm admin:create` (admins are created already verified) |
| Approve / decline new jobs | `/admin/jobs?status=Pending` (you're emailed when one arrives) |
| Suspend, reactivate or delete a user | `/admin/users` (or Candidates / Employers) |
| Hide a job or company | `/admin/jobs`, `/admin/companies` |
| Add/edit categories or locations | `/admin/categories`, `/admin/locations` |
| Answer users | `/admin/messages` |
| See contact messages and subscribers | `/admin/newsletter` |
| Check errors | Vercel → Project → **Logs** (errors are logged with a reference shown on the error page) |
| Database backups | Neon → **Branches / Restore** (point-in-time restore on the free plan covers recent history) |

---

## 5. Known limits at launch (next release)
- **AI career tools and employer AI** (CV screening, applicant ranking, job-description help): instant checks work; personalised AI needs an AI provider key — planned next.
- **Blog / testimonials CMS**: the blog shows "coming soon"; testimonials come from the existing ADDOZ site. An admin editor is planned next.
- **Free-tier ceilings**: Brevo 300 emails/day; Neon 0.5 GB (CVs stored in the database count toward this — move to R2 as volume grows); Vercel Hobby is non-commercial.
- **Messages refresh every 15 seconds** (not instant push).
