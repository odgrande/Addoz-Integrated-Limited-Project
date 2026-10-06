import type { Metadata } from "next"
import { AppLink, MagneticButton, PageHeader } from "@/components/patterns"
import { Accordion, type AccordionItem } from "@/features/content/components/accordion"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers for job seekers and employers using ADDOZ — searching and applying, posting a job, the Career Intelligence tools, and how to reach us.",
}

type Group = { id: string; label: string; items: AccordionItem[] }

const groups: Group[] = [
  {
    id: "job-seekers",
    label: "Job seekers",
    items: [
      {
        id: "search-and-filter",
        question: "How do I find the right jobs on ADDOZ?",
        answer: <p>Search, then narrow the results with filters for category, location, skills, job type and experience level, so you’re left with roles that actually fit what you want.</p>,
      },
      {
        id: "save-roles",
        question: "Can I save a job to come back to later?",
        answer: <p>Yes. Every listing has a save button, so you can shortlist roles while you compare your options and return to them when you’re ready to apply.</p>,
      },
      {
        id: "apply",
        question: "How do I apply for a job?",
        answer: <p>Open the listing to review the role, the company and the salary, then apply directly through ADDOZ from that page.</p>,
      },
    ],
  },
  {
    id: "employers",
    label: "Employers",
    items: [
      {
        id: "post-a-job",
        question: "How do I post a job, and what does it cost?",
        answer: <p>Posting is free. The form is built to take about two minutes, so you can get a role live without a long back-and-forth.</p>,
      },
      {
        id: "visibility",
        question: "How long does a posting stay visible?",
        answer: <p>A job posting stays visible to job seekers for 30 days.</p>,
      },
      {
        id: "review-applications",
        question: "Who reviews the applications we receive?",
        answer: <p>You do. Applications come straight to your employer account for you to review, shortlist and interview in your own time.</p>,
      },
    ],
  },
  {
    id: "career-intelligence",
    label: "Career Intelligence",
    items: [
      {
        id: "what-are-the-tools",
        question: "What is Career Intelligence?",
        answer: <p>Three tools built to help with a job search: a Resume Scanner / ATS Checker, an Interview Questions Generator, and a Cover Letter Generator.</p>,
      },
      {
        id: "login-required",
        question: "Do I need an account to use the career tools?",
        answer: <p>No — the instant checks in each Career Intelligence tool work without an account. Personalised AI analysis is coming soon and will be available to signed-in members.</p>,
      },
    ],
  },
  {
    id: "about-addoz",
    label: "About ADDOZ",
    items: [
      {
        id: "who-is-addoz",
        question: "Who is ADDOZ?",
        answer: <p>{site.legalName}. {site.mission}</p>,
      },
      {
        id: "where-based",
        question: "Where is ADDOZ based?",
        answer: <p>Our {site.office.label.toLowerCase()} is at {site.office.lines.join(", ")}.</p>,
      },
      {
        id: "get-in-touch",
        question: "How can I get in touch?",
        answer: <p>
          Email <a className="text-link" href={`mailto:${site.email}`}>{site.email}</a>, call one of the
          numbers on the <AppLink className="text-link" href="/contact">contact page</AppLink>, or send a
          message there directly.
        </p>,
      },
    ],
  },
]

export default function FaqPage() {
  return <>
    <PageHeader
      variant="editorial"
      tone="cream"
      size="lg"
      eyebrow="FAQ"
      title="Questions, answered."
      lead="For job seekers, employers and anyone curious about the Career Intelligence tools — grouped so you can jump straight to what you need."
    />
    <section className="page-section tight">
      <div className="ed-faq-layout">
        <nav className="ed-faq-nav" aria-label="FAQ categories">
          <p className="t-label">Jump to</p>
          <ul>
            {groups.map(group => <li key={group.id}><a href={`#${group.id}`}>{group.label}</a></li>)}
          </ul>
        </nav>
        <div className="ed-faq-groups">
          {groups.map(group => <div key={group.id} id={group.id} className="ed-faq-group">
            <h2 className="ed-faq-group-title">{group.label}</h2>
            <Accordion items={group.items} />
          </div>)}
        </div>
      </div>
    </section>
    <section className="page-section tone-cream-dark tight">
      <div className="ed-faq-closing">
        <p className="t-h2-statement">Still have a question?</p>
        <MagneticButton href="/contact" arrow>Talk to us</MagneticButton>
      </div>
    </section>
  </>
}
