import type { Metadata } from "next"
import { MessagesWorkspace } from "@/features/messages/components/messages-ui"

export const metadata: Metadata = { title: "Messages" }

export default async function EmployerMessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams
  return <main className="employer-page"><header className="app-page-header"><div><p className="app-eyebrow">Inbox</p><h1>Messages</h1><p className="app-page-lead">Talk with candidates who applied to your roles, and with the ADDOZ team.</p></div></header><MessagesWorkspace area="employer" initialId={c} /></main>
}
