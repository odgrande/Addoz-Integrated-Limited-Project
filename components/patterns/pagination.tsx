"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const set = new Set([1, total, current, current - 1, current + 1].filter(page => page >= 1 && page <= total))
  const sorted = [...set].sort((a, b) => a - b)
  return sorted.flatMap((page, index) => (index && page - sorted[index - 1]! > 1 ? ["…" as const, page] : [page]))
}

export function Pagination({ page, pageCount, onChange, label = "Pagination", className }: { page: number; pageCount: number; onChange: (page: number) => void; label?: string; className?: string }) {
  if (pageCount <= 1) return null
  return <nav className={cn("pagination", className)} aria-label={label}>
    <button type="button" className="page-step" onClick={() => onChange(page - 1)} disabled={page <= 1}><ArrowLeft size={16} aria-hidden="true" /><span>Previous</span></button>
    <ol className="page-list">
      {pages(page, pageCount).map((item, index) => <li key={`${item}-${index}`}>
        {item === "…" ? <span className="page-gap" aria-hidden="true">…</span> : <button type="button" className={cn("page-number", item === page && "is-current")} aria-current={item === page ? "page" : undefined} aria-label={`Page ${item}`} onClick={() => onChange(item)}>{item}</button>}
      </li>)}
    </ol>
    <p className="page-status">Page {page} of {pageCount}</p>
    <button type="button" className="page-step" onClick={() => onChange(page + 1)} disabled={page >= pageCount}><span>Next</span><ArrowRight size={16} aria-hidden="true" /></button>
  </nav>
}
