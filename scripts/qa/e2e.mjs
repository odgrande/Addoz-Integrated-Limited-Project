/**
 * QA end-to-end run against a local server backed by the throwaway PGlite
 * database (never the live one). Phases:
 *   node scripts/qa/e2e.mjs register   → create + verify accounts
 *   (stop server, promote admin, restart)
 *   node scripts/qa/e2e.mjs main       → every signed-in flow
 *   (stop server, expire the job, restart)
 *   node scripts/qa/e2e.mjs expiry     → expiry + reinstate
 * Credentials are random and kept in .qa/credentials.json (git-ignored).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { randomBytes } from "node:crypto"

const BASE = process.env.QA_BASE ?? "http://localhost:3200"
const LOG = process.env.QA_LOG ?? ".qa/server.log"
const CREDS = ".qa/credentials.json"
const STATE = ".qa/state.json"
let failures = 0
let passes = 0

function check(label, ok, detail = "") {
  if (ok) { passes++; console.log(`  PASS ${label}`) }
  else { failures++; console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`) }
}

class Client {
  constructor(name) { this.name = name; this.cookies = new Map() }
  cookieHeader() { return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") }
  store(response) {
    for (const line of response.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(";"); const index = pair.indexOf("=")
      const key = pair.slice(0, index).trim(); const value = pair.slice(index + 1).trim()
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(line) || value === "") this.cookies.delete(key); else this.cookies.set(key, value)
    }
  }
  async req(method, path, { json, form, redirect = "manual", extraHeaders = {} } = {}) {
    const headers = { origin: BASE, cookie: this.cookieHeader(), ...extraHeaders }
    let body
    if (json !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(json) }
    if (form) body = form
    const response = await fetch(BASE + path, { method, headers, body, redirect })
    this.store(response)
    const text = await response.text()
    let data = null; try { data = JSON.parse(text) } catch {}
    return { status: response.status, data, text, headers: response.headers }
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function latestCode(email, after) {
  for (let i = 0; i < 40; i++) {
    const log = readFileSync(LOG, "utf8").slice(after)
    const blocks = log.split("[email:dev] To: ").filter(block => block.startsWith(email))
    const match = blocks.length ? blocks[blocks.length - 1].match(/verification code is (\d{6})/) : null
    if (match) return match[1]
    await sleep(500)
  }
  return null
}

function cvDocx(lines) {
  // Minimal .docx via a stored (uncompressed) zip
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${lines.map(line => `<w:p><w:r><w:t>${line.replace(/&/g, "&amp;")}</w:t></w:r></w:p>`).join("")}</w:body></w:document>`
  const files = [["[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'], ["word/document.xml", xml]]
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
  const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
  const parts = []; const central = []; let offset = 0
  for (const [name, content] of files) {
    const data = Buffer.from(content); const nameBuf = Buffer.from(name); const crc = crc32(data)
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26)
    parts.push(local, nameBuf, data)
    const entry = Buffer.alloc(46); entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(data.length, 20); entry.writeUInt32LE(data.length, 24); entry.writeUInt16LE(nameBuf.length, 28); entry.writeUInt32LE(offset, 42)
    central.push(entry, nameBuf); offset += 30 + nameBuf.length + data.length
  }
  const centralBuf = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...parts, centralBuf, end])
}

function cvPdf(text) {
  const stream = `BT /F1 11 Tf 50 750 Td (${text.replace(/[()\\]/g, "")}) Tj ET`
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
  let out = "%PDF-1.4\n"; const offsets = []
  objects.forEach((object, index) => { offsets.push(out.length); out += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(o => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(out, "latin1")
}

let ipCounter = 10
async function signIn(client, email, password) {
  // Each simulated person comes from their own address, as on the live site (Netlify's client-IP header)
  client.ip ??= `198.51.100.${ipCounter++}`
  const result = await client.req("POST", "/api/auth/sign-in/email", { json: { email, password }, extraHeaders: { "x-nf-client-connection-ip": client.ip } })
  return result.status === 200
}

async function rateLimitIsPerVisitor() {
  const attempt = ip => new Client("x").req("POST", "/api/auth/sign-in/email", { json: { email: "nobody@addoz.test", password: "wrong-password-1" }, extraHeaders: { "x-nf-client-connection-ip": ip } })
  const statuses = []
  for (let i = 0; i < 4; i++) statuses.push((await attempt("203.0.113.7")).status)
  check("repeated sign-in attempts from one visitor are throttled", statuses.at(-1) === 429, statuses.join(","))
  check("another visitor is not affected", (await attempt("203.0.113.8")).status === 401)
}

async function pages(client, paths, label) {
  for (const path of paths) {
    const result = await client.req("GET", path)
    check(`${label} page ${path}`, result.status === 200, `HTTP ${result.status}${result.headers.get("location") ? ` → ${result.headers.get("location")}` : ""}`)
  }
}

async function register() {
  const pass = () => `Qa-${randomBytes(9).toString("base64url")}`
  const creds = {
    admin: { email: "qa.admin@addoz.test", password: pass(), name: "QA Admin" },
    employer: { email: "qa.employer@addoz.test", password: pass(), name: "Ngozi Hiring", company: "QA Tech Ltd" },
    strong: { email: "qa.strong@addoz.test", password: pass(), name: "Ada Strong" },
    weak: { email: "qa.weak@addoz.test", password: pass(), name: "Bayo Weak" },
  }
  writeFileSync(CREDS, JSON.stringify(creds, null, 2))
  console.log("Registering and verifying accounts")
  for (const [key, account] of Object.entries(creds)) {
    const client = new Client(key)
    const before = existsSync(LOG) ? readFileSync(LOG, "utf8").length : 0
    const role = key === "employer" ? "employer" : "candidate"
    const result = await client.req("POST", "/api/register", { json: { email: account.email, password: account.password, name: account.name, role, companyName: account.company } })
    check(`register ${key}`, result.status === 201, `${result.status} ${result.text.slice(0, 120)}`)
    const blocked = await signIn(new Client("x"), account.email, account.password)
    check(`${key} cannot sign in before verifying`, !blocked)
    const code = await latestCode(account.email, before)
    check(`${key} verification code emailed`, Boolean(code))
    const verify = await client.req("POST", "/api/auth/email-otp/verify-email", { json: { email: account.email, otp: code } })
    check(`${key} email verified`, verify.status === 200, `${verify.status} ${verify.text.slice(0, 120)}`)
  }
}

async function main() {
  const creds = JSON.parse(readFileSync(CREDS, "utf8"))
  const admin = new Client("admin"), employer = new Client("employer"), strong = new Client("strong"), weak = new Client("weak"), guest = new Client("guest")
  console.log("Sign-in rate limit")
  await rateLimitIsPerVisitor()
  console.log("Sign in")
  check("admin signs in", await signIn(admin, creds.admin.email, creds.admin.password))
  check("employer signs in", await signIn(employer, creds.employer.email, creds.employer.password))
  check("strong candidate signs in", await signIn(strong, creds.strong.email, creds.strong.password))
  check("weak candidate signs in", await signIn(weak, creds.weak.email, creds.weak.password))
  check("employer cannot use admin API", (await employer.req("GET", "/api/admin/users")).status === 401)
  check("candidate cannot use employer API", (await strong.req("GET", "/api/employer/applicants")).status === 401)

  console.log("Employer posts a job")
  const company = await employer.req("PUT", "/api/employer/company", { json: { name: "QA Tech Ltd", industry: "Technology", description: "We build software.", locationId: "loc_ikeja", companySize: "11-50" } })
  check("company profile saved", company.status === 200, company.text)
  const posted = await employer.req("POST", "/api/employer/jobs", { json: { title: "Frontend Developer", categoryId: "cat_development-it", locationId: "loc_ikeja", type: "Full-time", level: "Middle", experience: "3-5 years", workplace: "Hybrid", summary: "Build fast, accessible web apps for African job seekers.", responsibilities: "Build responsive user interfaces\nCollaborate with designers", requirements: "3+ years building web apps\nBSc in Computer Science or related", skills: "React, TypeScript, Node.js, CSS", durationDays: "7", status: "Active" } })
  check("job created and sent for review", posted.status === 201 && posted.data?.status === "Pending", posted.text.slice(0, 200))
  const jobId = posted.data?.id, slug = posted.data?.slug
  check("pending job not public", (await guest.req("GET", `/jobs/${slug}`)).status === 404)

  console.log("Admin approves")
  const approve = await admin.req("PATCH", `/api/admin/jobs/${jobId}`, { json: { action: "approve" } })
  check("admin approves job", approve.status === 200 && approve.data?.status === "Active", approve.text)
  const jobView = await employer.req("GET", `/api/employer/jobs/${jobId}`)
  const days = (new Date(jobView.data?.job?.deadline) - new Date(jobView.data?.job?.postedAt)) / 86_400_000
  check("listing runs 7 days from approval", Math.round(days) === 7, `got ${days}`)
  check("job public after approval", (await guest.req("GET", `/jobs/${slug}`)).status === 200)
  check("job in search results", (await guest.req("GET", "/jobs?q=Frontend")).text.includes("Frontend Developer"))

  console.log("Candidates apply (CV required)")
  const applyForm = (extra = {}) => { const form = new FormData(); form.set("name", extra.name ?? "x"); form.set("email", extra.email ?? "x@x.test"); form.set("phone", ""); form.set("coverLetter", extra.cover ?? ""); form.set("consent", "true"); form.set("useProfileResume", extra.useProfile ? "true" : "false"); if (extra.cv) form.set("cv", extra.cv); return form }
  const noCv = await strong.req("POST", `/api/jobs/${slug}/apply`, { form: applyForm({ name: creds.strong.name, email: creds.strong.email, useProfile: true }) })
  check("candidate without profile CV is asked to add one", noCv.status === 400 && noCv.data?.code === "PROFILE_CV_REQUIRED", noCv.text)
  const strongCv = cvDocx(["Ada Strong - Frontend Developer", "5 years experience building web apps with React, TypeScript, Node.js and CSS.", "B.Sc Computer Science. Collaborated with designers on responsive user interfaces."])
  const upload = new FormData(); upload.set("resume", new File([strongCv], "ada-cv.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }))
  const up = await strong.req("POST", "/api/candidate/resume", { form: upload })
  check("candidate uploads CV to profile", up.status === 200 || up.status === 201, up.text.slice(0, 200))
  const applied = await strong.req("POST", `/api/jobs/${slug}/apply`, { form: applyForm({ name: creds.strong.name, email: creds.strong.email, useProfile: true, cover: "I love building accessible React apps." }) })
  check("strong candidate applies with profile CV", applied.status === 201, applied.text)
  check("cannot apply twice", (await strong.req("POST", `/api/jobs/${slug}/apply`, { form: applyForm({ name: creds.strong.name, email: creds.strong.email, useProfile: true }) })).data?.code === "ALREADY_APPLIED")

  const weakUpload = new FormData(); weakUpload.set("resume", new File([cvPdf("Bayo Weak - Dispatch rider and driver. Customer care and delivery routes around Lagos. 2 years.")], "bayo.pdf", { type: "application/pdf" }))
  check("weak candidate uploads PDF CV", [200, 201].includes((await weak.req("POST", "/api/candidate/resume", { form: weakUpload })).status))
  check("weak candidate applies", (await weak.req("POST", `/api/jobs/${slug}/apply`, { form: applyForm({ name: creds.weak.name, email: creds.weak.email, useProfile: true }) })).status === 201)
  const guestApply = await guest.req("POST", `/api/jobs/${slug}/apply`, { form: applyForm({ name: "Chika Guest", email: "qa.guest@addoz.test", cv: new File([cvPdf("Chika Guest frontend developer React TypeScript 3 years CSS")], "chika.pdf", { type: "application/pdf" }) }) })
  check("guest applies with uploaded CV", guestApply.status === 201, guestApply.text)
  check("employer cannot apply", (await employer.req("POST", `/api/jobs/${slug}/apply`, { form: applyForm({ cv: new File([cvPdf("x")], "x.pdf") }) })).status === 403)

  console.log("Employer reviews applicants")
  const list = await employer.req("GET", "/api/employer/applicants")
  const rows = Array.isArray(list.data) ? list.data : []
  const byName = name => rows.find(row => row.candidateName === name)
  check("3 applicants listed", rows.length === 3, `got ${rows.length}`)
  check("strong CV scores Top match", byName(creds.strong.name)?.match?.band === "top", JSON.stringify(byName(creds.strong.name)?.match))
  check("weak CV scores Low match", byName(creds.weak.name)?.match?.band === "low", JSON.stringify(byName(creds.weak.name)?.match))
  check("guest CV scored from PDF", byName("Chika Guest")?.match?.cvRead === true, JSON.stringify(byName("Chika Guest")?.match))
  const strongApp = byName(creds.strong.name)?.id, weakApp = byName(creds.weak.name)?.id
  const reviewPage = await employer.req("GET", `/employer/jobs/${jobId}/applicants`)
  check("applicant review page shows match bands", reviewPage.status === 200 && reviewPage.text.includes("Top match") && reviewPage.text.includes("Ada Strong"))

  const bulk = await employer.req("PATCH", "/api/employer/applications/bulk", { json: { ids: [strongApp], stage: "Shortlisted" } })
  check("bulk shortlist top match", bulk.status === 200 && bulk.data?.updated === 1, bulk.text)
  check("bulk decline low match", (await employer.req("PATCH", "/api/employer/applications/bulk", { json: { ids: [weakApp], stage: "Not selected" } })).data?.updated === 1)
  check("single stage change", (await employer.req("PATCH", `/api/employer/applications/${strongApp}`, { json: { stage: "Interview" } })).status === 200)

  // The QA server has no email provider (the live site does): email is refused cleanly, messages still work
  const noEmail = await employer.req("POST", `/api/employer/applications/${strongApp}/contact`, { json: { subject: "Interview invitation", body: "Hi Ada, can you do Tuesday at 10am?", email: true, message: true } })
  check("email refused clearly when no email service", noEmail.status === 503 && /in-app message/.test(noEmail.data?.error ?? ""), noEmail.text.slice(0, 200))
  const contact = await employer.req("POST", `/api/employer/applications/${strongApp}/contact`, { json: { subject: "Interview invitation", body: "Hi Ada, can you do Tuesday at 10am?", email: false, message: true } })
  check("in-app message to applicant", contact.status === 200 && contact.data?.sent?.[0] === "message", contact.text.slice(0, 200))
  check("contact needs email or message", (await employer.req("POST", `/api/employer/applications/${strongApp}/contact`, { json: { subject: "Hi", body: "Hello there", email: false, message: false } })).status === 400)
  check("save applicant", (await employer.req("PUT", `/api/employer/applications/${strongApp}/save`)).status === 200)
  const savedPage = await employer.req("GET", "/employer/saved")
  check("saved applicants page lists them", savedPage.status === 200 && savedPage.text.includes("Ada Strong"))
  const profilePage = await employer.req("GET", `/employer/applicants/${strongApp}`)
  check("applicant profile page", profilePage.status === 200 && profilePage.text.includes("Interview"))
  const cvInline = await employer.req("GET", `/api/employer/applications/${weakApp}/cv?view=1`)
  check("PDF CV opens inline", cvInline.status === 200 && (cvInline.headers.get("content-disposition") ?? "").startsWith("inline"), cvInline.headers.get("content-disposition"))
  const cvDownload = await employer.req("GET", `/api/employer/applications/${strongApp}/cv?view=1`)
  check("Word CV downloads (not inline)", cvDownload.status === 200 && (cvDownload.headers.get("content-disposition") ?? "").startsWith("attachment"))
  check("other employers' applicants are hidden", (await strong.req("GET", `/api/employer/applications/${strongApp}/cv`)).status === 401)

  console.log("Candidate side")
  const notes = await strong.req("GET", "/api/candidate/notifications")
  check("candidate notified of stage changes", Array.isArray(notes.data) && notes.data.some(item => /Interview|Shortlisted/.test(item.body)), JSON.stringify(notes.data?.map(item => item.title)))
  const threads = await strong.req("GET", "/api/messages")
  const thread = (threads.data?.conversations ?? threads.data ?? [])[0]
  check("candidate sees employer's message thread", Boolean(thread), threads.text.slice(0, 200))
  if (thread) {
    const reply = await strong.req("POST", `/api/messages/${thread.id}`, { json: { body: "Tuesday works, thank you!" } })
    check("candidate replies", reply.status === 200 || reply.status === 201, reply.text)
  }
  const employerUnread = await employer.req("GET", "/api/notifications/unread")
  check("employer bell shows unread", employerUnread.data?.unread > 0, employerUnread.text)

  console.log("Admin broadcast")
  const before = (await weak.req("GET", "/api/notifications/unread")).data?.unread ?? 0
  const cast = await admin.req("POST", "/api/admin/broadcast", { json: { audience: "candidates", title: "Welcome to ADDOZ", body: "Complete your profile to stand out.", href: "/candidate/profile", sendEmail: false } })
  check("broadcast to candidates", cast.status === 200 && cast.data?.recipients >= 3, cast.text)
  const after = (await weak.req("GET", "/api/notifications/unread")).data?.unread ?? 0
  check("candidate unread count went up", after === before + 1, `${before} → ${after}`)
  check("employers didn't get candidate broadcast", !(await employer.req("GET", "/api/employer/notifications")).data?.some?.(item => item.title === "Welcome to ADDOZ"))
  check("broadcast to one person", (await admin.req("POST", "/api/admin/broadcast", { json: { audience: "user", email: creds.employer.email, title: "Hello employer", body: "Thanks for joining ADDOZ.", sendEmail: false } })).data?.recipients === 1)
  check("unknown person rejected", (await admin.req("POST", "/api/admin/broadcast", { json: { audience: "user", email: "nobody@addoz.test", title: "Hello", body: "Nobody here." } })).status === 404)
  check("mark all read clears badge", (await weak.req("PATCH", "/api/candidate/notifications", { json: { id: "all" } })).status === 200 && (await weak.req("GET", "/api/notifications/unread")).data?.unread === 0)

  console.log("Every signed-in page")
  await pages(strong, ["/candidate/dashboard", "/candidate/applications", "/candidate/messages", "/candidate/saved-jobs", "/candidate/job-alerts", "/candidate/profile", "/candidate/resume", `/candidate/resume?redirect=/jobs/${slug}?apply=1`, "/candidate/notifications", "/candidate/settings"], "candidate")
  await pages(employer, ["/employer/dashboard", "/employer/jobs", "/employer/jobs?view=expired", "/employer/jobs?view=archived", "/employer/jobs?view=review", "/employer/jobs/new", `/employer/jobs/${jobId}/edit`, `/employer/jobs/${jobId}/applicants`, "/employer/applicants", "/employer/applicants?match=top&sort=match", `/employer/applicants/${strongApp}`, "/employer/saved", "/employer/messages", "/employer/analytics", "/employer/company", "/employer/profile", "/employer/notifications", "/employer/settings"], "employer")
  await pages(admin, ["/admin", "/admin/jobs", "/admin/jobs?status=Pending", "/admin/applications", "/admin/companies", "/admin/categories", "/admin/locations", "/admin/users", "/admin/candidates", "/admin/employers", "/admin/messages", "/admin/notifications", "/admin/blog", "/admin/ai-tools", "/admin/testimonials", "/admin/newsletter", "/admin/settings"], "admin")
  await pages(strong, [`/jobs/${slug}`, "/jobs", "/"], "candidate public")
  check("candidate blocked from employer pages", (await strong.req("GET", "/employer/dashboard")).status === 307)
  check("employer blocked from admin pages", (await employer.req("GET", "/admin")).status === 307)

  writeFileSync(STATE, JSON.stringify({ jobId, slug, strongApp }))
}

async function expiry() {
  const creds = JSON.parse(readFileSync(CREDS, "utf8")); const state = JSON.parse(readFileSync(STATE, "utf8"))
  const employer = new Client("employer"), guest = new Client("guest"), strong = new Client("strong")
  await signIn(employer, creds.employer.email, creds.employer.password); await signIn(strong, creds.strong.email, creds.strong.password)
  console.log("Expiry")
  check("expired job gone from public page", (await guest.req("GET", `/jobs/${state.slug}`)).status === 404)
  check("expired job gone from search", !(await guest.req("GET", "/jobs?q=Frontend")).text.includes("Frontend Developer"))
  const form = new FormData(); form.set("name", "Late"); form.set("email", "late@addoz.test"); form.set("consent", "true"); form.set("cv", new File([cvPdf("late applicant")], "late.pdf", { type: "application/pdf" }))
  check("expired job refuses applications", (await guest.req("POST", `/api/jobs/${state.slug}/apply`, { form })).status === 410)
  const expiredTab = await employer.req("GET", "/employer/jobs?view=expired")
  check("employer sees it under Expired with Reinstate", expiredTab.text.includes("Frontend Developer") && expiredTab.text.includes("Reinstate"))
  check("applicants kept after expiry", (await employer.req("GET", "/api/employer/applicants")).data?.length === 3)
  const reinstate = await employer.req("PATCH", `/api/employer/jobs/${state.jobId}`, { json: { status: "Active", durationDays: 14 } })
  check("reinstate for 14 days", reinstate.status === 200 && reinstate.data?.status === "Active", reinstate.text)
  const job = (await employer.req("GET", `/api/employer/jobs/${state.jobId}`)).data?.job
  check("new 14-day window", Math.round((new Date(job?.deadline) - Date.now()) / 86_400_000) === 14, job?.deadline)
  check("job public again", (await guest.req("GET", `/jobs/${state.slug}`)).status === 200)
  check("archive keeps it out of public", (await employer.req("DELETE", `/api/employer/jobs/${state.jobId}`)).status === 200 && (await guest.req("GET", `/jobs/${state.slug}`)).status === 404)
  check("archived tab shows it", (await employer.req("GET", "/employer/jobs?view=archived")).text.includes("Frontend Developer"))
  check("reinstate from archive", (await employer.req("PATCH", `/api/employer/jobs/${state.jobId}`, { json: { status: "Active", durationDays: 30 } })).data?.status === "Active" && (await guest.req("GET", `/jobs/${state.slug}`)).status === 200)
  console.log("Sign out")
  check("sign out", (await strong.req("POST", "/api/auth/sign-out", { json: {} })).status === 200 && (await strong.req("GET", "/candidate/dashboard")).status === 307)
}

const phase = process.argv[2]
await (phase === "register" ? register() : phase === "expiry" ? expiry() : main())
console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures ? 1 : 0)
