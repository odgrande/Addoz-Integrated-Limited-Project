import type { Metadata } from "next"
import { PublicShell } from "@/components/layout/public-shell"
import { ActionButton } from "@/components/patterns/action-button"

export const metadata: Metadata = { title: "Page not found", robots: { index: false } }

export default function NotFound() {
  return <PublicShell>
    <section className="status-page section-pad" aria-labelledby="page-title">
      <p className="eyebrow"><span className="eyebrow-line" />404 — Not found</p>
      <h1 id="page-title">Wrong turn.</h1>
      <p className="status-page-lead">That page isn&apos;t here yet — or it has moved. Let&apos;s get you back on track.</p>
      <div className="cluster">
        <ActionButton href="/jobs" variant="primary" arrow>Browse jobs</ActionButton>
        <ActionButton href="/" variant="light">Back to home</ActionButton>
      </div>
    </section>
  </PublicShell>
}
