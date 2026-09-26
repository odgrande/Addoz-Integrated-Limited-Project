"use client"

import { CircleAlert } from "lucide-react"

/**
 * Accessible error summary for auth forms — announced once via role="alert"
 * (an implicit assertive live region) when validation fails on submit.
 */
export function ErrorSummary({ errors, id }: { errors: string[]; id?: string }) {
  if (!errors.length) return null
  return <div className="au-error-summary" id={id} role="alert">
    <p className="au-error-summary-title"><CircleAlert size={16} aria-hidden="true" /> Please fix the following:</p>
    <ul>{errors.map(message => <li key={message}>{message}</li>)}</ul>
  </div>
}
