"use client"

import { useMemo, useState } from "react"
import { ActionButton, EmptyState } from "@/components/patterns"
import { cn } from "@/lib/utils"
import type { Post } from "@/features/blog/data"
import { ArticleCard } from "./article-card"

/**
 * Real, client-side topic filtering over the published posts (currently none —
 * see features/blog/data.ts). The chips work today; there is simply nothing
 * published yet, and the empty state says so honestly.
 */
export function TopicBrowser({ posts, topics }: { posts: Post[]; topics: string[] }) {
  const [topic, setTopic] = useState<string | null>(null)
  const filtered = useMemo(() => topic ? posts.filter(post => post.topic === topic) : posts, [posts, topic])

  return (
    <div>
      <div className="bl-topics" role="group" aria-label="Filter articles by topic">
        <button type="button" className={cn("bl-topic", topic === null && "is-active")} aria-pressed={topic === null} onClick={() => setTopic(null)}>All</button>
        {topics.map(item => (
          <button key={item} type="button" className={cn("bl-topic", topic === item && "is-active")} aria-pressed={topic === item} onClick={() => setTopic(item)}>{item}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title="The first articles are on the way"
          body={topic ? `Nothing published on ${topic} yet — the ADDOZ team is writing the first pieces. Explore Career Intelligence in the meantime.` : "The ADDOZ team is writing the first career resources. Explore Career Intelligence while you wait."}
          action={<ActionButton href="/career-tools" variant="ghost" arrow>Explore Career Intelligence</ActionButton>}
        />
      ) : (
        <div className="card-grid">{filtered.map(post => <ArticleCard key={post.slug} post={post} />)}</div>
      )}
    </div>
  )
}
