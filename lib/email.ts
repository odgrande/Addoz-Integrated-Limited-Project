/**
 * Transactional email (OTP codes, password links, notifications).
 * Provider is picked from the environment:
 * - BREVO_API_KEY  → Brevo (free: 300 emails/day; verify one sender address).
 * - RESEND_API_KEY → Resend (free: 100/day; needs a verified domain).
 * EMAIL_FROM is the sender, e.g. "ADDOZ <addozng@gmail.com>".
 * Development without a key prints the message (and its code/link) to the
 * server console. Production without a key logs an error; nothing is sent.
 */
export type EmailMessage = { to: string; subject: string; text: string; html: string }

function parseSender(from: string) {
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  return match ? { name: match[1]!.replace(/^"|"$/g, "") || "ADDOZ", email: match[2]!.trim() } : { name: "ADDOZ", email: from.trim() }
}

export function emailProvider(): "brevo" | "resend" | null {
  if (!process.env.EMAIL_FROM?.trim()) return null
  if (process.env.BREVO_API_KEY?.trim()) return "brevo"
  if (process.env.RESEND_API_KEY?.trim()) return "resend"
  return null
}

export function isEmailConfigured() {
  return emailProvider() !== null
}

export async function sendEmail(message: EmailMessage) {
  const provider = emailProvider()
  const from = process.env.EMAIL_FROM?.trim() ?? ""

  if (!provider) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[email:dev] To: ${message.to}\n[email:dev] Subject: ${message.subject}\n${message.text}\n`)
      return
    }
    console.error(`[email] Not sent — set BREVO_API_KEY (or RESEND_API_KEY) and EMAIL_FROM (subject: ${message.subject})`)
    return
  }

  const response = provider === "brevo"
    ? await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY!.trim(), "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sender: parseSender(from), to: [{ email: message.to }], subject: message.subject, htmlContent: message.html, textContent: message.text }),
      })
    : await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      })
  if (!response.ok) {
    console.error(`[email] ${provider} rejected the message (${response.status}): ${await response.text().catch(() => "")}`)
    throw new Error("Email could not be sent")
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!)
}

/** A plain, branded single-action email. */
export function actionEmail({ to, subject, greeting, body, actionLabel, actionUrl, footer }: { to: string; subject: string; greeting: string; body: string; actionLabel: string; actionUrl: string; footer: string }): EmailMessage {
  const text = `${greeting}\n\n${body}\n\n${actionLabel}: ${actionUrl}\n\n${footer}\n\n— ADDOZ`
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f1e7;font-family:Arial,Helvetica,sans-serif;color:#0d1119">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
<tr><td><p style="font-weight:800;font-size:20px;margin:0 0 24px">ADDOZ</p>
<p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
<p style="margin:0 0 24px;line-height:1.6">${escapeHtml(body)}</p>
<p style="margin:0 0 24px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#800cb6;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">${escapeHtml(actionLabel)}</a></p>
<p style="margin:0;color:#5c5f66;font-size:13px;line-height:1.6">${escapeHtml(footer)}</p></td></tr></table></body></html>`
  return { to, subject, text, html }
}

/** The 6-digit email verification code. */
export function codeEmail({ to, code }: { to: string; code: string }): EmailMessage {
  const subject = `${code} is your ADDOZ verification code`
  const text = `Your ADDOZ verification code is ${code}.

Enter it on the verification page to activate your account. The code expires in 10 minutes.

If you didn't create an ADDOZ account, you can ignore this email.

— ADDOZ`
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f1e7;font-family:Arial,Helvetica,sans-serif;color:#0d1119">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
<tr><td><p style="font-weight:800;font-size:20px;margin:0 0 24px">ADDOZ</p>
<p style="margin:0 0 12px">Your verification code:</p>
<p style="margin:0 0 24px;font-size:32px;font-weight:800;letter-spacing:8px">${escapeHtml(code)}</p>
<p style="margin:0 0 12px;line-height:1.6">Enter it on the verification page to activate your account. The code expires in 10 minutes.</p>
<p style="margin:0;color:#5c5f66;font-size:13px">If you didn't create an ADDOZ account, you can ignore this email.</p></td></tr></table></body></html>`
  return { to, subject, text, html }
}
