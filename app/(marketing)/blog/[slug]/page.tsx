import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Clock } from "lucide-react"
import { PageHeader, PrototypeNote, SectionHeading } from "@/components/patterns"
import { formatDate } from "@/lib/format"
import { getPost, layoutPreview, posts } from "@/features/blog/data"
import { ArticleBody, estimateReadingTime } from "@/features/blog/components/blocks"
import { ReadingProgress } from "@/features/blog/components/reading-progress"
import { RelatedLinks } from "@/features/blog/components/related-links"

const ARTICLE_ID = "article-content"

export function generateStaticParams() {
  return [layoutPreview, ...posts].map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: "Article not found" }
  return {
    title: post.title,
    description: post.dek,
    robots: post.preview ? { index: false } : undefined,
  }
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const readingTime = estimateReadingTime(post.body)

  return (
    <>
      <PageHeader
        eyebrow={post.topic}
        title={post.title}
        lead={post.dek}
        crumbs={[{ label: "Blog", href: "/blog" }, { label: post.title }]}
        meta={
          <div className="bl-article-meta">
            {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
            <span><Clock size={14} aria-hidden="true" /> {readingTime}</span>
          </div>
        }
      />

      <ReadingProgress targetId={ARTICLE_ID} />

      <section className="page-section tone-white">
        {post.preview && (
          <PrototypeNote title="Layout preview" compact>This page previews the reading experience — it isn&apos;t a published article.</PrototypeNote>
        )}
        <ArticleBody id={ARTICLE_ID} blocks={post.body} />
      </section>

      <section className="page-section tone-cream-dark tight">
        <SectionHeading eyebrow="KEEP EXPLORING" title="Related tools and roles" />
        <RelatedLinks />
      </section>
    </>
  )
}
