"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LifeBuoy, LoaderCircle, MessageSquare, Send } from "lucide-react"
import { cn } from "@/lib/utils"

type Conversation = { id: string; kind: "application" | "support"; subject: string; counterpart: string; preview: string | null; lastMessageAt: string; unread: boolean }
type Thread = { id: string; kind: string; subject: string; messages: { id: string; body: string; createdAt: string; mine: boolean; sender: string; pending?: boolean }[] }
type Area = "candidate" | "employer" | "admin"

const POLL_MS = 15_000
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

async function json<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((payload as { error?: string }).error || "Something went wrong.")
  return payload as T
}

/**
 * Inbox + thread for one workspace. Candidates and employers talk about an
 * application, or with the ADDOZ team; admins see every support thread and can
 * read application threads for moderation. Refreshes every 15 seconds.
 */
export function MessagesWorkspace({ area, initialId }: { area: Area; initialId?: string }) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [activeId, setActiveId] = useState<string | undefined>(initialId)
  const [thread, setThread] = useState<Thread | null>(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<"all" | "application" | "support">("all")
  const end = useRef<HTMLDivElement>(null)
  // A ref, not state: it blocks a second send in the same instant (double tap, Ctrl+Enter)
  const sending = useRef(false)

  const loadList = useCallback(async () => {
    try { setConversations((await json<{ conversations: Conversation[] }>("/api/messages")).conversations) }
    catch (err) { setError(err instanceof Error ? err.message : "Messages are unavailable.") }
  }, [])

  const loadThread = useCallback(async (id: string) => {
    try { setThread(await json<Thread>(`/api/messages/${id}`)) }
    catch (err) { setThread(null); setError(err instanceof Error ? err.message : "That conversation couldn't be opened.") }
  }, [])

  useEffect(() => { void loadList() }, [loadList])
  useEffect(() => { if (activeId) void loadThread(activeId); else setThread(null) }, [activeId, loadThread])
  useEffect(() => {
    const id = setInterval(() => { void loadList(); if (activeId) void loadThread(activeId) }, POLL_MS)
    return () => clearInterval(id)
  }, [activeId, loadList, loadThread])
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }) }, [thread?.messages.length])

  function open(id: string | undefined) {
    setActiveId(id)
    setError("")
    router.replace(id ? `/${area}/messages?c=${id}` : `/${area}/messages`, { scroll: false })
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!activeId || !text || sending.current) return
    sending.current = true
    setBusy(true)
    setError("")
    // Show it straight away; the real message replaces it once saved
    const tempId = `pending-${Date.now()}`
    setDraft("")
    setThread(current => current && current.id === activeId ? { ...current, messages: [...current.messages, { id: tempId, body: text, createdAt: new Date().toISOString(), mine: true, sender: "You", pending: true }] } : current)
    try {
      await json(`/api/messages/${activeId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: text }) })
      await Promise.all([loadThread(activeId), loadList()])
    } catch (err) {
      setThread(current => current ? { ...current, messages: current.messages.filter(item => item.id !== tempId) } : current)
      setDraft(text)
      setError(err instanceof Error ? err.message : "Your message wasn't sent.")
    } finally { sending.current = false; setBusy(false) }
  }

  async function contactSupport() {
    setBusy(true)
    try {
      const { id } = await json<{ id: string }>("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject: "Support request" }) })
      await loadList()
      open(id)
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't start a conversation.") }
    finally { setBusy(false) }
  }

  const visible = (conversations ?? []).filter(item => filter === "all" || item.kind === filter)
  const readOnly = area === "admin" && thread?.kind === "application"

  return <div className={cn("msg-workspace", activeId && "has-thread")}>
    <aside className="msg-list" aria-label="Conversations">
      <div className="msg-list-head">
        <div className="filter-chips" role="group" aria-label="Filter conversations">
          {(["all", "application", "support"] as const).map(value => <button key={value} type="button" className={cn("chip", filter === value && "is-active")} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {value === "all" ? "All" : value === "application" ? "Applications" : area === "admin" ? "Support" : "ADDOZ team"}
          </button>)}
        </div>
        {area !== "admin" && <button type="button" className="action-button action-ghost msg-support" onClick={contactSupport} disabled={busy}><LifeBuoy size={16} aria-hidden="true" />Contact ADDOZ</button>}
      </div>
      {conversations === null
        ? <p className="msg-empty"><LoaderCircle className="spin" size={18} aria-hidden="true" /> Loading…</p>
        : visible.length === 0
          ? <div className="msg-empty"><MessageSquare size={28} aria-hidden="true" /><p>{area === "employer" ? "Message an applicant from your applicants list." : area === "candidate" ? "Messages from employers about your applications appear here." : "Message any user from the Users page."}</p></div>
          : <ul>{visible.map(item => <li key={item.id}>
              <button type="button" className={cn("msg-item", item.id === activeId && "is-active", item.unread && "is-unread")} onClick={() => open(item.id)} aria-current={item.id === activeId || undefined}>
                <span className="msg-item-top"><strong>{item.counterpart}</strong><time>{when(item.lastMessageAt)}</time></span>
                <span className="msg-item-subject">{item.kind === "application" ? `Re: ${item.subject}` : item.subject}</span>
                <span className="msg-item-preview">{item.preview ?? "No messages yet"}</span>
                {item.unread && <span className="msg-dot" aria-label="Unread" />}
              </button>
            </li>)}</ul>}
    </aside>

    <section className="msg-thread" aria-label="Conversation">
      {!activeId
        ? <div className="msg-empty"><MessageSquare size={32} aria-hidden="true" /><p>Choose a conversation.</p></div>
        : !thread
          ? <div className="msg-empty">{error ? <p role="alert">{error}</p> : <><LoaderCircle className="spin" size={18} aria-hidden="true" /> Loading…</>}</div>
          : <>
              <header className="msg-thread-head">
                <button type="button" className="app-icon-button msg-back" onClick={() => open(undefined)} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
                <div><p className="app-eyebrow">{thread.kind === "application" ? "Application" : "ADDOZ support"}</p><h2>{thread.subject}</h2></div>
              </header>
              <div className="msg-messages" aria-live="polite">
                {thread.messages.length === 0 && <p className="msg-empty-inline">No messages yet — say hello.</p>}
                {thread.messages.map(item => <div key={item.id} className={cn("msg-bubble", item.mine && "is-mine", item.pending && "is-pending")}>
                  <p className="msg-meta"><strong>{item.mine ? "You" : item.sender}</strong> · {item.pending ? <span>Sending…</span> : <time>{when(item.createdAt)}</time>}</p>
                  <p className="msg-body">{item.body}</p>
                </div>)}
                <div ref={end} />
              </div>
              {readOnly
                ? <p className="msg-readonly">Read-only: admins can review application conversations but don&apos;t post in them.</p>
                : <form className="msg-compose" onSubmit={send}>
                    <label htmlFor="msg-draft" className="sr-only">Write a message</label>
                    <textarea id="msg-draft" className="input" rows={3} maxLength={5000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write a message…"
                      onKeyDown={event => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send(event) }} />
                    {error && <p className="field-error" role="alert">{error}</p>}
                    <button type="submit" className="action-button action-primary" disabled={busy || !draft.trim()}>{busy ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}Send</button>
                  </form>}
            </>}
    </section>
  </div>
}

/** Opens (or creates) a conversation, then goes to it. */
export function MessageButton({ area, applicationId, userId, label = "Message", className }: { area: Area; applicationId?: string; userId?: string; label?: string; className?: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function go() {
    setBusy(true)
    try {
      const { id } = await json<{ id: string }>("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(applicationId ? { applicationId } : { userId }) })
      router.push(`/${area}/messages?c=${id}`)
    } catch { setBusy(false) }
  }
  return <button type="button" className={cn("action-button action-ghost", className)} onClick={go} disabled={busy}><MessageSquare size={15} aria-hidden="true" />{busy ? "Opening…" : label}</button>
}
