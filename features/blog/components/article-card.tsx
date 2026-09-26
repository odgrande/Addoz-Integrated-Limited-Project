import { ArrowUpRight } from "lucide-react"
import { AppLink, StatusBadge } from "@/components/patterns"
import { formatDate } from "@/lib/format"
import type { Post } from "@/features/blog/data"

/** One article teaser — also used for the layout-preview entry, clearly tagged. */
export function ArticleCard({ post }: { post: Post }) {
  return (
    <AppLink href={`/blog/${post.slug}`} className="card-frame is-interactive bl-card">
      <span className="bl-card-top">
        <span className="bl-card-topic">{post.topic}</span>
        {post.preview && <StatusBadge tone="accent" dot={false}>Layout preview</StatusBadge>}
      </span>
      <h3 className="bl-card-title">{post.title}</h3>
      <p className="bl-card-dek">{post.dek}</p>
      <span className="bl-card-meta">
        {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
        <span>{post.readingTime}</span>
      </span>
      <ArrowUpRight className="bl-card-arrow" size={18} aria-hidden="true" />
    </AppLink>
  )
}
