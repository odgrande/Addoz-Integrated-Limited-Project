"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // Server errors arrive here with only a digest; match it against the server logs.
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
        {/* retry() re-fetches the server segment; reset() would only re-render the failed tree */}
        <button onClick={() => retry()} className="action-button action-dark">
          Try again
        </button>
        <Link href="/" className="action-button action-light">
          <ArrowLeft size={18} />
          Back to ADDOZ
        </Link>
      </div>
      {error.digest && <p className="status-page-lead" style={{ fontSize: "0.8rem", opacity: 0.6 }}>Error reference: {error.digest}</p>}
    </main>
  )
}
