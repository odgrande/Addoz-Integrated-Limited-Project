"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to monitoring service in production (Sentry etc.)
    console.error(error)
  }, [error])

  return (
    <main id="main" className="status-page section-pad">
      <div className="eyebrow">
        <span className="eyebrow-line" /> SOMETHING WENT WRONG
      </div>
      <h1>
        Unexpected error.
      </h1>
      <p className="status-page-lead">
        Something went wrong loading this page. Try again, or head back to ADDOZ.
      </p>
      <div className="cluster">
        <button onClick={reset} className="action-button action-dark">
          Try again
        </button>
        <Link href="/" className="action-button action-light">
          <ArrowLeft size={18} />
          Back to ADDOZ
        </Link>
      </div>
    </main>
  )
}
