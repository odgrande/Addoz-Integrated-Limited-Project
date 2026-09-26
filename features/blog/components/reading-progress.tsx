"use client"

import { useEffect, useState, type CSSProperties } from "react"

/**
 * Slim reading-progress bar, sticky under the header (desktop only — see CSS).
 * Reads the named element's position each frame while scrolling; purely a
 * subtle visual aid, so it is aria-hidden.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return
    let frame = 0
    const update = () => {
      frame = 0
      const rect = target.getBoundingClientRect()
      const viewport = window.innerHeight
      const total = rect.height - viewport * 0.5
      const scrolled = viewport * 0.5 - rect.top
      setProgress(total <= 0 ? 1 : Math.min(1, Math.max(0, scrolled / total)))
    }
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [targetId])

  return (
    <div className="bl-progress" aria-hidden="true">
      <span className="bl-progress-fill" style={{ "--bl-progress": progress } as CSSProperties} />
    </div>
  )
}
