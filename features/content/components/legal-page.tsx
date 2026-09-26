import { PageHeader, StatusBadge } from "@/components/patterns"
import { site } from "@/lib/site"

export type LegalSection = { id: string; heading: string; summary: string }

/**
 * Shared shell for /privacy and /terms (Directive 009 — editorial). Both pages are
 * an honest OUTLINE: what each section will cover, not the clauses themselves —
 * real wording follows legal review. Motion is limited to the PageHeader's own
 * headline reveal; nothing else on this page moves.
 */
export function LegalPage({ eyebrow, title, intro, sections }: {
  eyebrow: string
  title: string
  intro: string
  sections: LegalSection[]
}) {
  return <>
    <PageHeader
      variant="editorial"
      tone="cream"
      size="md"
      eyebrow={eyebrow}
      title={title}
      lead={intro}
      meta={<div className="ed-legal-status">
        <StatusBadge tone="warning">Draft — pending legal review</StatusBadge>
        <span className="t-small">Last updated: not yet published</span>
      </div>}
    />
    <section className="page-section tight">
      <div className="ed-legal-layout">
        <nav className="ed-legal-toc" aria-label={`${title} — contents`}>
          <p className="t-label">On this page</p>
          <ol>
            {sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>)}
          </ol>
        </nav>
        <div className="ed-legal-content">
          <p className="ed-legal-note">
            The sections below outline what this {title.toLowerCase()} will cover. It is a working
            draft, not a final legal document — the full wording is published once ADDOZ’s legal
            review is complete.
          </p>
          {sections.map(section => <div key={section.id} id={section.id} className="ed-legal-section">
            <h2>{section.heading}</h2>
            <p>{section.summary}</p>
          </div>)}
          <div className="ed-legal-section">
            <h2>Questions about this {title.toLowerCase()}</h2>
            <p>
              Email <a className="text-link" href={`mailto:${site.email}`}>{site.email}</a> if
              anything here needs clarifying before the final version is published.
            </p>
          </div>
        </div>
      </div>
    </section>
  </>
}
