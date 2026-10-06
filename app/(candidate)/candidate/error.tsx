"use client"

export default function CandidateError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="candidate-page candidate-error" role="alert"><p className="app-eyebrow">Candidate workspace</p><h1>That view could not load.</h1><p>There was a temporary problem reaching your account data.</p><button className="action-button action-primary" type="button" onClick={() => retry()}>Try again</button></main>
}
