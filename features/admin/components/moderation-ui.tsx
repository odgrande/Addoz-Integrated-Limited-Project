"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ShieldAlert, Trash2, X } from "lucide-react"

async function send(url: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(payload.error || "That didn't work. Please try again.")
  return payload
}

/** Inline "type DELETE" confirmation — no browser dialogs. */
function ConfirmDelete({ label, onConfirm, onCancel, busy }: { label: string; onConfirm: () => void; onCancel: () => void; busy: boolean }) {
  const [typed, setTyped] = useState("")
  return <span className="admin-confirm">
    <label className="sr-only" htmlFor={`confirm-${label}`}>Type DELETE to confirm</label>
    <input id={`confirm-${label}`} className="input" value={typed} onChange={event => setTyped(event.target.value)} placeholder="Type DELETE" autoFocus />
    <button type="button" className="action-button action-primary admin-danger" disabled={busy || typed !== "DELETE"} onClick={onConfirm}>{busy ? "Deleting…" : label}</button>
    <button type="button" className="admin-icon-action" onClick={onCancel} aria-label="Cancel"><X size={16} aria-hidden="true" /></button>
  </span>
}

/** Suspend / reactivate / permanently delete a candidate or employer. */
export function AdminUserActions({ id, banned, name }: { id: string; banned: boolean | null; name: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<"idle" | "suspend" | "delete">("idle")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  async function run(task: () => Promise<unknown>) {
    setBusy(true); setError("")
    try { await task(); setMode("idle"); setReason(""); router.refresh() }
    catch (err) { setError(err instanceof Error ? err.message : "That didn't work.") }
    finally { setBusy(false) }
  }

  return <div className="admin-row-actions">
    {mode === "idle" && <>
      {banned
        ? <button type="button" className="action-button action-ghost" disabled={busy} onClick={() => run(() => send(`/api/admin/users/${id}`, "PATCH", { banned: false }))}><Check size={15} aria-hidden="true" />Reactivate</button>
        : <button type="button" className="action-button action-ghost" disabled={busy} onClick={() => setMode("suspend")}><ShieldAlert size={15} aria-hidden="true" />Suspend</button>}
      <button type="button" className="admin-icon-action" onClick={() => setMode("delete")} aria-label={`Delete ${name}`}><Trash2 size={16} aria-hidden="true" /></button>
    </>}
    {mode === "suspend" && <span className="admin-confirm">
      <label className="sr-only" htmlFor={`reason-${id}`}>Reason (shown in the audit log)</label>
      <input id={`reason-${id}`} className="input" value={reason} onChange={event => setReason(event.target.value)} placeholder="Reason (optional)" maxLength={300} autoFocus />
      <button type="button" className="action-button action-primary" disabled={busy} onClick={() => run(() => send(`/api/admin/users/${id}`, "PATCH", { banned: true, banReason: reason || undefined }))}>{busy ? "Suspending…" : "Suspend"}</button>
      <button type="button" className="admin-icon-action" onClick={() => setMode("idle")} aria-label="Cancel"><X size={16} aria-hidden="true" /></button>
    </span>}
    {mode === "delete" && <ConfirmDelete label="Delete account" busy={busy} onCancel={() => setMode("idle")} onConfirm={() => run(() => send(`/api/admin/users/${id}`, "DELETE", { confirm: "DELETE" }))} />}
    {error && <small className="field-error" role="alert">{error}</small>}
  </div>
}

/** Approve / decline (with reason) / pause / archive / restore / delete a job. */
export function AdminJobActions({ id, status }: { id: string; status: string | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<"idle" | "decline" | "delete">("idle")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true); setError("")
    try { await send(`/api/admin/jobs/${id}`, "PATCH", { action, ...extra }); setMode("idle"); setNote(""); router.refresh() }
    catch (err) { setError(err instanceof Error ? err.message : "That didn't work.") }
    finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true); setError("")
    try { await send(`/api/admin/jobs/${id}`, "DELETE", { confirm: "DELETE" }); router.refresh() }
    catch (err) { setError(err instanceof Error ? err.message : "That didn't work."); setBusy(false) }
  }

  const button = (label: string, action: string) => <button key={action} type="button" className="action-button action-ghost" disabled={busy} onClick={() => act(action)}>{label}</button>

  return <div className="admin-row-actions">
    {mode === "idle" && <>
      {(status === "Pending" || status === "Declined" || status === "Draft") && button("Approve", "approve")}
      {status === "Pending" && <button type="button" className="action-button action-ghost" disabled={busy} onClick={() => setMode("decline")}>Decline</button>}
      {status === "Active" && button("Pause", "pause")}
      {(status === "Paused" || status === "Archived" || status === "Closed") && button("Restore", "restore")}
      {status !== "Archived" && button("Archive", "archive")}
      <button type="button" className="admin-icon-action" onClick={() => setMode("delete")} aria-label="Delete job permanently"><Trash2 size={16} aria-hidden="true" /></button>
    </>}
    {mode === "decline" && <span className="admin-confirm">
      <label className="sr-only" htmlFor={`note-${id}`}>Reason for the employer</label>
      <input id={`note-${id}`} className="input" value={note} onChange={event => setNote(event.target.value)} placeholder="What should the employer fix?" maxLength={500} autoFocus />
      <button type="button" className="action-button action-primary" disabled={busy || !note.trim()} onClick={() => act("decline", { note })}>{busy ? "Sending…" : "Decline"}</button>
      <button type="button" className="admin-icon-action" onClick={() => setMode("idle")} aria-label="Cancel"><X size={16} aria-hidden="true" /></button>
    </span>}
    {mode === "delete" && <ConfirmDelete label="Delete job" busy={busy} onCancel={() => setMode("idle")} onConfirm={remove} />}
    {error && <small className="field-error" role="alert">{error}</small>}
  </div>
}
