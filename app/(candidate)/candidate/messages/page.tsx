import type { Metadata } from "next"
import { MessagesWorkspace } from "@/features/messages/components/messages-ui"

export const metadata: Metadata = { title: "Messages" }

export default async function CandidateMessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams
  return <main className="candidate-page"><header className="app-page-header"><div><p className="app-eyebrow">Inbox</p><h1>Messages</h1><p className="app-page-lead">Conversations with employers about your applications, and with the ADDOZ team.</p></div></header><MessagesWorkspace area="candidate" initialId={c} /></main>
}
