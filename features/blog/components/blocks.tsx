import { AppLink } from "@/components/patterns"
import { cn } from "@/lib/utils"
import type { Block } from "@/features/blog/data"

const WORDS_PER_MINUTE = 220

function wordsIn(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Reading time computed from the article's own blocks, never a hand-typed guess. */
export function estimateReadingTime(blocks: Block[]) {
  const words = blocks.reduce((total, block) => {
    if (block.kind === "p" || block.kind === "h2") return total + wordsIn(block.text)
    if (block.kind === "quote") return total + wordsIn(block.text)
    if (block.kind === "list") return total + wordsIn(block.items.join(" "))
    if (block.kind === "callout") return total + wordsIn(`${block.title} ${block.text}`)
    return total
  }, 0)
  return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min read`
}

export function ArticleBody({ blocks, id }: { blocks: Block[]; id?: string }) {
  return (
    <div id={id} className="prose bl-article-body">
      {blocks.map((block, index) => <BlockView key={index} block={block} />)}
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "p":
      return <p>{block.text}</p>
    case "h2":
      return <h2>{block.text}</h2>
    case "quote":
      return (
        <blockquote className="bl-pullquote">
          <p>{block.text}</p>
          {block.cite && <cite className="bl-pullquote-cite">{block.cite}</cite>}
        </blockquote>
      )
    case "list":
      return <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul>
    case "callout": {
      const forResumeScanner = /resume scanner/i.test(block.text) || /resume scanner/i.test(block.title)
      return (
        <div className="bl-callout">
          <p className="bl-callout-title">{block.title}</p>
          <p>{block.text}</p>
          <div className="bl-callout-actions">
            <AppLink href={forResumeScanner ? "/career-tools/resume-scanner" : "/career-tools"} className={cn("text-link", "bl-callout-link")}>
              {forResumeScanner ? "Open Resume Scanner" : "Open Career Intelligence"}
            </AppLink>
          </div>
        </div>
      )
    }
    default:
      return null
  }
}
