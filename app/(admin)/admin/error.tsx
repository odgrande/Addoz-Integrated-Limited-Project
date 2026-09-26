"use client"

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="admin-page admin-error" role="alert"><p className="app-eyebrow">Admin workspace</p><h1>That view could not load.</h1><p>There was a temporary problem reaching moderation data.</p><button className="action-button action-primary" type="button" onClick={reset}>Try again</button></main> }
