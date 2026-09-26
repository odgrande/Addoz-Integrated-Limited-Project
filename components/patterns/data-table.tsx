"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Pagination } from "./pagination"

export type Column<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: "left" | "right" | "center"
  width?: string
  primary?: boolean        // the row's title — leads each card on phones
  hideOnMobile?: boolean
}

/**
 * Data table for the employer and admin apps: sortable columns, row selection
 * with a bulk-action bar, optional row click (detail view), built-in paging and
 * an empty state. Below 768px each row becomes a labelled card — same markup.
 */
export function DataTable<T>({ rows, columns, getRowId, caption, selectable, bulkActions, onRowClick, rowLabel, empty, toolbar, pageSize = 10, density = "comfortable", className }: {
  rows: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  caption: string
  selectable?: boolean
  bulkActions?: (selected: string[], clear: () => void) => ReactNode
  onRowClick?: (row: T) => void
  rowLabel?: (row: T) => string
  empty?: ReactNode
  toolbar?: ReactNode
  pageSize?: number
  density?: "comfortable" | "compact"
  className?: string
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    const column = columns.find(item => item.key === sort?.key)
    if (!sort || !column?.sortValue) return rows
    const value = column.sortValue
    return [...rows].sort((a, b) => {
      const x = value(a), y = value(b)
      const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))
      return sort.dir === "asc" ? order : -order
    })
  }, [rows, columns, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pageCount)
  const visible = sorted.slice((current - 1) * pageSize, current * pageSize)
  const visibleIds = visible.map(getRowId)
  const allOnPage = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id))
  const clear = () => setSelected([])

  function toggleSort(key: string) {
    setSort(previous => (previous?.key === key ? (previous.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }))
  }

  return <div className={cn("data-table-wrap", `density-${density}`, className)}>
    {toolbar && <div className="data-table-toolbar">{toolbar}</div>}
    {selectable && selected.length > 0 && bulkActions && <div className="bulk-bar" role="region" aria-label="Bulk actions">
      <strong>{selected.length} selected</strong>
      <div className="bulk-actions">{bulkActions(selected, clear)}</div>
      <button type="button" className="bulk-clear" onClick={clear}>Clear selection</button>
    </div>}
    {rows.length === 0 ? (empty ?? null) : <>
      <div className="data-table-scroll">
        <table className={cn("data-table", onRowClick && "is-clickable")}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {selectable && <th scope="col" className="cell-select">
                <input type="checkbox" aria-label="Select all rows on this page" checked={allOnPage} onChange={() => setSelected(allOnPage ? selected.filter(id => !visibleIds.includes(id)) : [...new Set([...selected, ...visibleIds])])} />
              </th>}
              {columns.map(column => {
                const active = sort?.key === column.key
                return <th key={column.key} scope="col" style={{ width: column.width }} className={cn(`align-${column.align ?? "left"}`)} aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}>
                  {column.sortValue ? <button type="button" className="sort-button" onClick={() => toggleSort(column.key)}>
                    {column.header}{active ? (sort!.dir === "asc" ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />) : <ArrowUpDown size={13} aria-hidden="true" />}
                  </button> : column.header}
                </th>
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map(row => {
              const id = getRowId(row)
              const isSelected = selected.includes(id)
              return <tr key={id} className={cn(isSelected && "is-selected")} onClick={onRowClick ? event => { if (!(event.target as Element).closest("a, button, input, select, label")) onRowClick(row) } : undefined}>
                {selectable && <td className="cell-select">
                  <input type="checkbox" aria-label={`Select ${rowLabel?.(row) ?? id}`} checked={isSelected} onChange={() => setSelected(isSelected ? selected.filter(item => item !== id) : [...selected, id])} />
                </td>}
                {columns.map(column => <td key={column.key} data-label={column.header} className={cn(`align-${column.align ?? "left"}`, column.primary && "cell-primary", column.hideOnMobile && "hide-mobile")}>{column.cell(row)}</td>)}
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={current} pageCount={pageCount} onChange={setPage} label={`${caption} pages`} className="data-table-pages" />
    </>}
  </div>
}
