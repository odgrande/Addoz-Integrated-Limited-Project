"use client"

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type AccordionItem = {
  id: string
  question: string
  answer: ReactNode
}

/**
 * Accessible accordion (Directive 009 — editorial). Each trigger is a real button
 * carrying aria-expanded/aria-controls; each panel is a labelled region. Arrow /
 * Home / End move focus between triggers. The open/close motion is CSS
 * (grid-template-rows) and is switched off under prefers-reduced-motion — see
 * .ed-accordion in styles/marketing.css — so the content works with no motion at all.
 */
export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const uid = useId()
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set())
  const triggers = useRef<(HTMLButtonElement | null)[]>([])

  const toggle = (id: string) => {
    setOpenIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const focusTrigger = (index: number) => {
    const count = items.length
    const target = triggers.current[(index + count) % count]
    target?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowDown") { event.preventDefault(); focusTrigger(index + 1) }
    else if (event.key === "ArrowUp") { event.preventDefault(); focusTrigger(index - 1) }
    else if (event.key === "Home") { event.preventDefault(); focusTrigger(0) }
    else if (event.key === "End") { event.preventDefault(); focusTrigger(items.length - 1) }
  }

  return <div className={cn("ed-accordion", className)}>
    {items.map((item, index) => {
      const isOpen = openIds.has(item.id)
      const triggerId = `${uid}-${item.id}-trigger`
      const panelId = `${uid}-${item.id}-panel`
      return <div key={item.id} className={cn("ed-accordion-item", isOpen && "is-open")}>
        <h3 className="ed-accordion-heading">
          <button
            ref={el => { triggers.current[index] = el }}
            type="button"
            id={triggerId}
            className="ed-accordion-trigger"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => toggle(item.id)}
            onKeyDown={event => onKeyDown(event, index)}
          >
            <span>{item.question}</span>
            <ChevronDown className="ed-accordion-icon" size={18} aria-hidden="true" />
          </button>
        </h3>
        <div className="ed-accordion-panel">
          <div className="ed-accordion-panel-inner">
            <div id={panelId} role="region" aria-labelledby={triggerId} className="ed-accordion-answer">
              {item.answer}
            </div>
          </div>
        </div>
      </div>
    })}
  </div>
}
