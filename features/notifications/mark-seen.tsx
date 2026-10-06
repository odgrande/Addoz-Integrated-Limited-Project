"use client"

import { useEffect } from "react"

/** Opening the notifications page marks everything read and clears the bell badge (items stay highlighted for this visit). */
export function MarkNotificationsSeen({ area, unread }: { area: "candidate" | "employer"; unread: number }) {
  useEffect(() => {
    if (!unread) return
    fetch(`/api/${area}/notifications`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "all" }) })
      .then(response => { if (response.ok) window.dispatchEvent(new Event("addoz:notifications-seen")) })
      .catch(() => undefined)
  }, [area, unread])
  return null
}
