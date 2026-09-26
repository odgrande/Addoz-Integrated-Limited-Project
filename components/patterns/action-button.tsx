import type { ButtonHTMLAttributes, ReactNode } from "react"
import { ArrowUpRight, LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppLink } from "./app-link"

/**
 * The ADDOZ button (existing .action-button system in globals.css).
 * href → link (curtain or instant, per shell); no href → <button>.
 */
export type ActionVariant = "dark" | "primary" | "yellow" | "orange" | "light" | "ghost" | "invert"

const variantClass: Record<ActionVariant, string> = {
  dark: "action-dark",
  primary: "action-primary",
  yellow: "action-yellow",
  orange: "action-orange",
  light: "action-light",
  ghost: "action-ghost",
  invert: "action-invert",
}

type Common = {
  variant?: ActionVariant
  size?: "sm" | "md" | "lg"
  arrow?: boolean
  icon?: ReactNode
  loading?: boolean
  block?: boolean
  magnetic?: boolean
  className?: string
  children: ReactNode
}

type LinkProps = Common & { href: string; target?: string; rel?: string; "aria-label"?: string; onClick?: () => void }
type ButtonProps = Common & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>

export function ActionButton(props: LinkProps | ButtonProps) {
  const { variant = "dark", size = "md", arrow, icon, loading, block, magnetic, className, children, ...rest } = props
  const classes = cn("action-button", variantClass[variant], size !== "md" && `action-${size}`, block && "action-block", className)
  const content = <>
    {loading ? <LoaderCircle className="action-spinner" size={17} aria-hidden="true" /> : icon}
    <span>{children}</span>
    {arrow && !loading && <ArrowUpRight size={size === "lg" ? 20 : 17} aria-hidden="true" />}
  </>
  if (rest.href !== undefined) {
    const { href, target, rel, onClick } = rest as Omit<LinkProps, keyof Common>
    return <AppLink href={href} target={target} rel={rel} onClick={onClick} aria-label={props["aria-label"]} className={classes} data-magnetic={magnetic || undefined}>{content}</AppLink>
  }
  const { type = "button", disabled, ...buttonProps } = rest as Omit<ButtonProps, keyof Common>
  return <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} data-magnetic={magnetic || undefined} {...buttonProps}>{content}</button>
}
