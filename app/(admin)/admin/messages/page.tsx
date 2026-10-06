import type { Metadata } from "next"
import { MessagesWorkspace } from "@/features/messages/components/messages-ui"

export const metadata: Metadata = { title: "Messages" }

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams
  return <main className="admin-page"><header className="app-page-header"><div><p className="app-eyebrow">Inbox</p><h1>Messages</h1><p className="app-page-lead">Support conversations with candidates and employers. Application threads are visible read-only for moderation.</p></div></header><MessagesWorkspace area="admin" initialId={c} /></main>
}
