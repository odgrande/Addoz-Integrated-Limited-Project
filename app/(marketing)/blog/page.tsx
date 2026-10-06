import type { Metadata } from "next"
import { EmptyState, PageHeader, SectionHeading } from "@/components/patterns"
import { blogIntro, posts, topics } from "@/features/blog/data"
import { site } from "@/lib/site"
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

      {posts.length > 0
        ? <section className="page-section tone-cream-dark">
            <SectionHeading eyebrow="ALL ARTICLES" title="Browse by topic" />
            <TopicBrowser posts={posts} topics={topics} />
          </section>
        : <section className="page-section tone-white">
            <EmptyState title="Our first articles are on the way" body="Practical guides for job seekers and employers are coming soon. Subscribe below and we'll let you know when they're published." />
          </section>}

      <section className="page-section tone-white tight">
        <SectionHeading eyebrow="STAY UPDATED" title={site.newsletter.title} lead={site.newsletter.body} />
        <NewsletterSignup />
      </section>
    </>
  )
}
