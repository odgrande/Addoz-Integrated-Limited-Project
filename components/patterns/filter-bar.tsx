"use client"

import type { ReactNode } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox, Radio } from "./form-field"

type Chip = { id: string; label: string; active: boolean; onToggle: () => void }
type Sort = { value: string; options: readonly { id: string; label: string }[]; onChange: (value: string) => void }

/**
 * Results toolbar: live result count, quick-filter chips, sort, and the button
 * that opens the full filter panel (a drawer on phones and tablets).
 */
export function FilterBar({ count, chips = [], sort, onOpenFilters, activeCount = 0, className, children }: {
  count: ReactNode
  chips?: Chip[]
  sort?: Sort
  onOpenFilters?: () => void
  activeCount?: number
  className?: string
  children?: ReactNode
}) {
  return <div className={cn("filter-bar", className)}>
    <p className="filter-count" aria-live="polite">{count}</p>
    {chips.length > 0 && <div className="filter-chips" role="group" aria-label="Quick filters">
      {chips.map(chip => <button key={chip.id} type="button" className={cn("chip", chip.active && "is-active")} aria-pressed={chip.active} onClick={chip.onToggle}>{chip.label}</button>)}
    </div>}
    <div className="filter-actions">
      {children}
      {sort && <label className="filter-sort">
        <span>Sort</span>
        <select value={sort.value} onChange={event => sort.onChange(event.target.value)}>
          {sort.options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>}
      {onOpenFilters && <button type="button" className="filter-open" onClick={onOpenFilters}>
        <SlidersHorizontal size={16} aria-hidden="true" /> Filters{activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
      </button>}
    </div>
  </div>
}

/** A labelled group of checkbox or radio options inside a filter panel. */
export function FilterGroup<T extends string>({ legend, options, selected, onChange, type = "checkbox", name, counts }: {
  legend: string
  options: readonly T[] | readonly { value: T; label: string }[]
  selected: T[] | T
  onChange: (next: T[] | T) => void
  type?: "checkbox" | "radio"
  name: string
  counts?: Partial<Record<T, number>>
}) {
  const items = (options as readonly (T | { value: T; label: string })[]).map(option => typeof option === "string" ? { value: option as T, label: option as string } : option)
  return <fieldset className="filter-group">
    <legend>{legend}</legend>
    {items.map(item => {
      const count = counts?.[item.value]
      const label = <>{item.label}{count !== undefined && <span className="filter-option-count">{count}</span>}</>
      if (type === "radio") return <Radio key={item.value} name={name} label={label} checked={selected === item.value} onChange={() => onChange(item.value)} />
      const list = selected as T[]
      return <Checkbox key={item.value} name={name} label={label} checked={list.includes(item.value)} onChange={() => onChange(list.includes(item.value) ? list.filter(value => value !== item.value) : [...list, item.value])} />
    })}
  </fieldset>
}

/** Removable summary of what is currently filtering the results. */
export function ActiveFilters({ items, onClear }: { items: { key: string; label: string; onRemove: () => void }[]; onClear: () => void }) {
  if (!items.length) return null
  return <div className="active-filter-list" aria-label="Active filters">
    {items.map(item => <button key={item.key} type="button" className="active-filter" onClick={item.onRemove} aria-label={`Remove filter: ${item.label}`}>{item.label}<X size={13} aria-hidden="true" /></button>)}
    <button type="button" className="active-filter-clear" onClick={onClear}>Clear all</button>
  </div>
}
