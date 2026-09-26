import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Dashboard panel: titled card with an optional action. Marked for the app's quiet mount reveal. */
export function Panel({ title, description, action, children, className, tone = "white", padded = true, id }: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  tone?: "white" | "cream" | "dark" | "purple" | "yellow"
  padded?: boolean
  id?: string
}) {
  return <section className={cn("panel", `panel-${tone}`, !padded && "panel-flush", className)} data-panel aria-labelledby={title && id ? id : undefined}>
    {(title || action) && <div className="panel-head">
      <div>
        {title && <h2 id={id} className="panel-title">{title}</h2>}
        {description && <p className="panel-description">{description}</p>}
      </div>
      {action && <div className="panel-action">{action}</div>}
    </div>}
    <div className="panel-body">{children}</div>
  </section>
}

/**
 * Metric tile. The number counts up once when the dashboard mounts (data-count,
 * handled by the app motion layer); the final value is always in the markup.
 */
export function StatTile({ label, value, format = "number", suffix, trend, hint, tone = "white" }: {
  label: string
  value: number
  format?: "number" | "percent"
  suffix?: string
  trend?: ReactNode
  hint?: ReactNode
  tone?: "white" | "dark" | "purple" | "yellow" | "orange"
}) {
  const display = format === "percent" ? `${value}%` : value.toLocaleString("en-GB")
  return <div className={cn("stat-tile", `stat-${tone}`)} data-panel>
    <p className="stat-label">{label}</p>
    <p className="stat-value"><span data-count={value} data-count-format={format}>{display}</span>{suffix && <small>{suffix}</small>}</p>
    {trend && <p className="stat-trend">{trend}</p>}
    {hint && <p className="stat-hint">{hint}</p>}
  </div>
}

/** Circular progress (profile completion etc.). Stroke drawn by the app motion layer. */
export function ProgressRing({ value, size = 104, label }: { value: number; size?: number; label: string }) {
  const radius = 42, circumference = 2 * Math.PI * radius
  return <div className="progress-ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${value}%`}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle className="ring-track" cx="50" cy="50" r={radius} />
      <circle className="ring-value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} data-ring={value} />
    </svg>
    <span className="ring-label"><strong>{value}%</strong></span>
  </div>
}

/** Segmented tabs for filtering a list inside a page (All / Active / Draft …). */
export function SegmentTabs<T extends string>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: { value: T; label: string; count?: number }[]; label: string }) {
  return <div className="segment-tabs" role="group" aria-label={label}>
    {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} className={cn("segment", value === option.value && "is-active")} onClick={() => onChange(option.value)}>
      {option.label}{option.count !== undefined && <span className="segment-count">{option.count}</span>}
    </button>)}
  </div>
}
