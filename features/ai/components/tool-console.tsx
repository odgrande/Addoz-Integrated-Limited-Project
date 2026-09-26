"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import { FileSearch, MessagesSquare, Pencil } from "lucide-react"
import { ActionButton } from "@/components/patterns"
import { careerTools } from "@/features/ai/tools"
import { cn } from "@/lib/utils"
import { ScreenFade } from "./screen-fade"

const icons = { "file-search": FileSearch, messages: MessagesSquare, pencil: Pencil }

/**
 * The Career Intelligence hub's one product stage: a keyboard-accessible tab
 * list switches which tool's steps + report sections the stage shows. This is
 * illustrative — the real, working tool lives on each tool's own page.
 */
export function ToolConsole() {
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const tool = careerTools[active]
  const Icon = icons[tool.icon]
  const panelId = "ci-console-panel"

  function move(next: number) {
    const clamped = (next + careerTools.length) % careerTools.length
    setActive(clamped)
    tabRefs.current[clamped]?.focus()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") { event.preventDefault(); move(active + 1) }
    else if (event.key === "ArrowLeft") { event.preventDefault(); move(active - 1) }
    else if (event.key === "Home") { event.preventDefault(); move(0) }
    else if (event.key === "End") { event.preventDefault(); move(careerTools.length - 1) }
  }

  return (
    <div className="ci-console">
      <div className="ci-tabs" role="tablist" aria-label="Career Intelligence tools" onKeyDown={onKeyDown}>
        {careerTools.map((t, index) => {
          const TabIcon = icons[t.icon]
          return (
            <button
              key={t.slug}
              ref={element => { tabRefs.current[index] = element }}
              type="button"
              role="tab"
              id={`ci-tab-${t.slug}`}
              aria-selected={index === active}
              aria-controls={panelId}
              tabIndex={index === active ? 0 : -1}
              className={cn("ci-tab", index === active && "is-active")}
              onClick={() => setActive(index)}
            >
              <span className="ci-tab-index tabular">{t.index}</span>
              <TabIcon className="ci-tab-icon" size={17} aria-hidden="true" />
              <span className="ci-tab-label">{t.name}</span>
            </button>
          )
        })}
      </div>

      <div className="ci-stage">
        <div className="ci-stage-bar">
          <span className="ci-stage-brand">addoz<span>.</span></span>
          <span className="ci-stage-crumb">{tool.liveName}</span>
          <span className="ci-stage-count tabular">{tool.index} / 03</span>
        </div>
        <div id={panelId} role="tabpanel" aria-labelledby={`ci-tab-${tool.slug}`}>
          <ScreenFade id={tool.slug} className="ci-stage-body">
            <p className="ci-screen-kicker"><Icon size={18} aria-hidden="true" />{tool.detail}</p>
            <div className="ci-screen-columns">
              <ol className="ci-screen-steps">
                {tool.steps.map((step, index) => (
                  <li key={step.title} className="ci-screen-step">
                    <span className="ci-screen-step-num tabular" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <span><b>{step.title}</b><small>{step.body}</small></span>
                  </li>
                ))}
              </ol>
              <div className="ci-screen-report">
                <p className="ci-screen-report-title">The report covers</p>
                <ul className="ci-screen-report-list">
                  {tool.report.map(section => <li key={section} className="ci-screen-report-item">{section}</li>)}
                </ul>
              </div>
            </div>
          </ScreenFade>
        </div>
      </div>

      <div className="ci-stage-foot">
        <p className="ci-stage-note">Illustrative product preview — try it for real below.</p>
        <ActionButton href={`/career-tools/${tool.slug}`} variant="primary" arrow>{tool.cta}</ActionButton>
      </div>
    </div>
  )
}
