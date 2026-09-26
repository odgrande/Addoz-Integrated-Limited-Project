/**
 * An uppercase label that GSAP decodes into place (ScrambleTextPlugin, driven from
 * homepage.tsx). Screen readers get the sr-only copy; the animated copy is
 * aria-hidden, so assistive tech never reads the scrambled letters.
 * trigger="view": decodes once as it scrolls into view.
 * trigger="hover": decodes again when its card is hovered (fine pointers only).
 */
export function ScrambleLabel({ text, trigger = "view" }: { text: string; trigger?: "view" | "hover" }) {
  return <><span className="sr-only">{text}</span><span data-scramble={trigger} aria-hidden="true">{text}</span></>
}
