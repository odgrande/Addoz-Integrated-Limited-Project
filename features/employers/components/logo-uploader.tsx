"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ImageUp, Trash2 } from "lucide-react"
import { CompanyMark } from "@/features/companies/components/company-mark"
import { markFor, toneFor } from "@/features/companies/brand"

/** Company logo: shown on every job card and the company page; initials on a colour until one is uploaded. */
export function LogoUploader({ initialLogo, companyName, companySlug }: { initialLogo: string | null; companyName: string; companySlug: string }) {
  const [logo, setLogo] = useState(initialLogo)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function upload(file: File) {
    if (file.size > 1024 * 1024) return setMessage({ tone: "error", text: "Logos must be 1 MB or smaller." })
    setBusy(true); setMessage(null)
    try {
      const body = new FormData(); body.set("logo", file)
      const response = await fetch("/api/employer/logo", { method: "POST", body })
      const payload = await response.json().catch(() => ({})) as { error?: string; logo?: string }
      if (!response.ok || !payload.logo) throw new Error(payload.error || "We couldn't upload the logo.")
      setLogo(payload.logo); setMessage({ tone: "ok", text: "Logo updated. It now shows on your jobs and company page." }); router.refresh()
    } catch (error) { setMessage({ tone: "error", text: error instanceof Error ? error.message : "We couldn't upload the logo." }) }
    finally { setBusy(false); if (input.current) input.current.value = "" }
  }

  async function remove() {
    setBusy(true); setMessage(null)
    try {
      const response = await fetch("/api/employer/logo", { method: "DELETE" })
      if (!response.ok) throw new Error("We couldn't remove the logo.")
      setLogo(null); setMessage({ tone: "ok", text: "Logo removed. Your initials show instead." }); router.refresh()
    } catch (error) { setMessage({ tone: "error", text: error instanceof Error ? error.message : "We couldn't remove the logo." }) }
    finally { setBusy(false) }
  }

  return <div className="field logo-uploader">
    <span className="field-label">Company logo</span>
    <div className="logo-uploader-row">
      <CompanyMark className="company-mark is-large" mark={markFor(companyName || "?")} tone={toneFor(companySlug || companyName)} logo={logo} />
      <div className="logo-uploader-actions">
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file) }} />
        <button type="button" className="action-button action-ghost action-sm" onClick={() => input.current?.click()} disabled={busy}><ImageUp size={15} aria-hidden="true" />{busy ? "Uploading..." : logo ? "Replace logo" : "Upload logo"}</button>
        {logo && <button type="button" className="action-button action-ghost action-sm" onClick={remove} disabled={busy}><Trash2 size={15} aria-hidden="true" />Remove</button>}
        <span className="field-hint">PNG, JPG or WebP, up to 1 MB. A square logo works best. Without one, your initials show on your company colour.</span>
      </div>
    </div>
    {message && <p className={message.tone === "ok" ? "form-message" : "field-error"} role={message.tone === "ok" ? "status" : "alert"}>{message.text}</p>}
  </div>
}
