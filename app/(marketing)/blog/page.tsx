import type { Metadata } from "next"
import { PageHeader, SectionHeading } from "@/components/patterns"
import { blogIntro, layoutPreview, posts, topics } from "@/features/blog/data"
import { site } from "@/lib/site"
import { ArticleCard } from "@/features/blog/components/article-card"
import { TopicBrowser } from "@/features/blog/components/topic-browser"
import { NewsletterSignup } from "@/features/blog/components/newsletter-signup"

export const metadata: Metadata = {
  title: "Blog",
  description: blogIntro.title,
}

export default function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrow={blogIntro.eyebrow}
        title={blogIntro.title}
        lead="Practical, honest reading for job seekers and employers — then put it to work in Career Intelligence."
      />

      <section className="page-section tone-white">
        <SectionHeading eyebrow="LAYOUT PREVIEW" title="See how an article reads" lead="The first real articles are on the way — here's the template they'll use." />
        <div className="bl-preview">
          <ArticleCard post={layoutPreview} />
        </div>
      </section>

      <section className="page-section tone-cream-dark">
        <SectionHeading eyebrow="ALL ARTICLES" title="Browse by topic" />
        <TopicBrowser posts={posts} topics={topics} />
      </section>

      <section className="page-section tone-white tight">
        <SectionHeading eyebrow="STAY UPDATED" title={site.newsletter.title} lead={site.newsletter.body} />
        <NewsletterSignup />
      </section>
    </>
  )
}
