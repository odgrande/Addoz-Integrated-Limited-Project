import { cn } from "@/lib/utils"
import { shapes, type ShapeColour, type ShapeName } from "./shapes"

/**
 * One of the sixteen ADDOZ brand shapes (the Y2K set, recoloured to the palette).
 * Decorative by default (aria-hidden); pass `label` when a shape carries meaning.
 * Colour comes from `colour` (brand token) or the surrounding text colour.
 * Server-safe: no hooks, so only the shapes a page uses reach the HTML.
 */
export function BrandShape({ name, colour, label, className, spin }: {
  name: ShapeName
  colour?: ShapeColour | "current"
  label?: string
  className?: string
  spin?: boolean
}) {
  const shape = shapes[name]
  const tone = colour === "current" ? undefined : colour ?? shape.colour
  return <svg viewBox={shape.viewBox} className={cn("brand-shape", tone && `shape-${tone}`, spin && "shape-spin", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
    {shape.paths.map((d, index) => <path key={index} d={d} fill="currentColor" />)}
  </svg>
}

export { shapeNames, type ShapeName } from "./shapes"
