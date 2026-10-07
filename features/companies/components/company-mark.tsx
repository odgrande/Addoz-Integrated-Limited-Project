import { cn } from "@/lib/utils"
import { safeLogo, type CompanyTone } from "../brand"

/**
 * The employer's square mark on cards and pages: their uploaded logo when they
 * have one, otherwise their initials on a brand colour. `className` carries the
 * size (job-mark, job-mark-large, company-mark, company-mark is-large).
 */
export function CompanyMark({ className, mark, tone, logo, flipId }: { className: string; mark: string; tone?: CompanyTone | string | null; logo?: string | null; flipId?: string }) {
  const src = safeLogo(logo)
  return <span className={cn(className, `tone-${tone ?? "purple"}`, src && "has-logo")} data-flip-id={flipId} aria-hidden="true">
    {/* eslint-disable-next-line @next/next/no-img-element -- small, already-sized logos; next/image is unoptimized here */}
    {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : mark}
  </span>
}
