"use client"

export default function EmployerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="employer-page employer-error" role="alert"><p className="app-eyebrow">Employer workspace</p><h1>That view could not load.</h1><p>There was a temporary problem reaching your company data.</p><button className="action-button action-primary" type="button" onClick={reset}>Try again</button></main> }
