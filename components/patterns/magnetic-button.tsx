import type { ComponentProps } from "react"
import { ActionButton } from "./action-button"

/**
 * An ActionButton that leans toward the pointer. The magnetic behaviour itself
 * lives in the public motion layer (components/motion/site-motion.ts), gated to
 * fine pointers and prefers-reduced-motion: no-preference; dashboards don't run it.
 */
export function MagneticButton(props: ComponentProps<typeof ActionButton>) {
  return <ActionButton {...props} magnetic />
}
