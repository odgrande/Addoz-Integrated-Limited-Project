/**
 * Blog ("Career resources"). The current ADDOZ site has a blog section — "Latest
 * from our blog · Get interesting insights, articles, and news" — but no published
 * posts, so none are listed here (Directive 007 §17: do not fabricate articles).
 *
 * The one entry below is a layout preview, not an article: it describes the
 * reading experience itself so the /blog/[slug] template can be reviewed.
 * Production: posts come from the CMS/blog table; the templates stay the same.
 */

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "quote"; text: string; cite?: string }
  | { kind: "list"; items: string[] }
  | { kind: "callout"; title: string; text: string }

export type Post = {
  slug: string
  title: string
  dek: string
  topic: string
  readingTime: string
  publishedAt: string | null
  preview: boolean
  body: Block[]
}

export const blogIntro = { eyebrow: "Latest from our blog", title: "Get interesting insights, articles, and news" }

export const topics = ["Job search", "CVs & applications", "Interviews", "Hiring", "Career growth"]

export const posts: Post[] = []

export const layoutPreview: Post = {
  slug: "reading-experience-preview",
  title: "How ADDOZ career resources will read",
  dek: "A preview of the article template — typography, pacing and the pieces every article can use. It is not a published article.",
  topic: "Layout preview",
  readingTime: "2 min read",
  publishedAt: null,
  preview: true,
  body: [
    { kind: "p", text: "Articles on ADDOZ are built for reading on a phone first: a comfortable measure, generous line spacing and headings that make a long piece easy to scan." },
    { kind: "h2", text: "What an article can include" },
    { kind: "list", items: ["Section headings for scanning", "Pull quotes to slow the reader down at the right moment", "Checklists for practical, step-by-step advice", "Callouts that link straight to Career Intelligence tools"] },
    { kind: "quote", text: "Every article should leave the reader with one thing they can do today.", cite: "ADDOZ editorial principle for this template" },
    { kind: "h2", text: "Where the content comes from" },
    { kind: "p", text: "Real articles will be written and published by the ADDOZ team through the admin blog manager. This preview exists so the reading experience can be reviewed before the first article goes live." },
    { kind: "callout", title: "Try it while you read", text: "Articles can end with a direct link to the right tool — for example, the Resume Scanner after a piece about CVs." },
  ],
}

export function getPost(slug: string) {
  if (slug === layoutPreview.slug) return layoutPreview
  return posts.find(post => post.slug === slug)
}
