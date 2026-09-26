import type { Metadata } from "next"
import Image from "next/image"
import { Briefcase, Building2, FileSearch, Handshake, Mail, MapPin, MessagesSquare, PenLine } from "lucide-react"
import { ActionButton, MagneticButton, PageHeader, Reveal, SectionHeading } from "@/components/patterns"
import { BrandShape } from "@/components/brand/brand-shape"
import { site } from "@/lib/site"
import { candidateProcess, employerProposition, testimonials } from "@/features/content/testimonials"
import { careerTools } from "@/features/ai/tools"
import { initials } from "@/lib/format"

export const metadata: Metadata = {
  title: "About",
  description: "ADDOZ connects Nigerian job seekers with opportunities and helps employers find the right talent, faster and easier — who we are and how the platform works.",
}

const toolIcons: Record<string, typeof FileSearch> = {
  "file-search": FileSearch,
  messages: MessagesSquare,
  pencil: PenLine,
}

const stepIndex = (n: number) => String(n).padStart(2, "0")

export default function AboutPage() {
  return <>
    <PageHeader
      variant="editorial"
      tone="cream"
      size="xl"
      eyebrow="ABOUT ADDOZ"
      title={<>We are transforming the way Nigeria<br className="desktop-break" /> finds and hires talent</>}
      lead={site.description}
      aside={<BrandShape name="orbit" colour="purple" className="ed-about-shape" />}
    />

    <section className="page-section tight">
      <div className="card-image ed-hero-image">
        <Image
          src="/images/team-editorial.png"
          alt="The ADDOZ team gathered around a table, mid-conversation"
          fill
          priority
          sizes="(min-width: 1360px) 1360px, 100vw"
          className="ed-hero-image-el"
        />
      </div>
    </section>

    <section className="page-section tight">
      <p className="ed-statement t-h2-statement">{site.mission}</p>
    </section>

    <section className="page-section tone-black">
      <SectionHeading eyebrow="HOW IT WORKS" title="What we do" />
      <Reveal className="ed-do-grid">
        <div className="ed-do-col">
          <p className="t-label ed-do-kicker"><Briefcase size={16} aria-hidden="true" /> For job seekers</p>
          <h3 className="t-h3">{candidateProcess.heading}</h3>
          <p className="t-body">{candidateProcess.body}</p>
          <ol className="ed-do-steps">
            {candidateProcess.steps.map((item, i) => <li key={item.title}>
              <span className="ed-do-step-index tabular" aria-hidden="true">{stepIndex(i + 1)}</span>
              <span className="ed-do-step-body">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </span>
            </li>)}
          </ol>
          <ActionButton href="/jobs" variant="invert" arrow>Search jobs</ActionButton>
        </div>
        <div className="ed-do-col">
          <p className="t-label ed-do-kicker"><Handshake size={16} aria-hidden="true" /> For employers</p>
          <h3 className="t-h3">{employerProposition.sub}</h3>
          <ol className="ed-do-steps">
            {employerProposition.benefits.map((item, i) => <li key={item.title}>
              <span className="ed-do-step-index tabular" aria-hidden="true">{stepIndex(i + 1)}</span>
              <span className="ed-do-step-body">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </span>
            </li>)}
          </ol>
          <ActionButton href="/for-employers" variant="invert" arrow>{employerProposition.cta}</ActionButton>
        </div>
      </Reveal>
    </section>

    <section className="page-section">
      <SectionHeading eyebrow="CAREER INTELLIGENCE" title="Tools that help" lead="Three tools built to support a job search, in one place." />
      <Reveal className="ed-tools-grid">
        {careerTools.map(tool => {
          const Icon = toolIcons[tool.icon] ?? FileSearch
          return <div key={tool.slug} className="ed-tools-item">
            <Icon size={22} aria-hidden="true" />
            <p className="ed-tools-name">{tool.name}</p>
            <p className="ed-tools-detail">{tool.detail}</p>
          </div>
        })}
      </Reveal>
      <div className="ed-tools-cta">
        <ActionButton href="/career-tools" variant="ghost" arrow>Explore Career Intelligence</ActionButton>
      </div>
    </section>

    <section className="page-section">
      <SectionHeading eyebrow="TESTIMONIALS" title="Real voices" />
      <Reveal as="ul" className="ed-testimonial-grid">
        {testimonials.map(person => <li key={person.name} className="card-outline ed-testimonial-card">
          <p className="t-body ed-testimonial-quote">“{person.quote}”</p>
          <div className="ed-testimonial-meta">
            <span className="ed-testimonial-avatar" aria-hidden="true">{initials(person.name)}</span>
            <span className="ed-testimonial-who">
              <span className="ed-testimonial-name">{person.name}</span>
              <span className="ed-testimonial-role">{person.role}</span>
            </span>
          </div>
        </li>)}
      </Reveal>
    </section>

    <section className="page-section tone-cream-dark">
      <div className="card-outline ed-facts-card">
        <p className="t-label">ADDOZ, in brief</p>
        <ul className="ed-facts-list">
          <li className="ed-facts-row">
            <Building2 size={18} aria-hidden="true" />
            <span>{site.legalName}</span>
          </li>
          <li className="ed-facts-row">
            <MapPin size={18} aria-hidden="true" />
            <span>{site.office.lines.join(", ")}</span>
          </li>
          <li className="ed-facts-row">
            <Mail size={18} aria-hidden="true" />
            <a className="text-link" href={`mailto:${site.email}`}>{site.email}</a>
          </li>
        </ul>
      </div>
    </section>

    <section className="page-section">
      <div className="ed-closing">
        <p className="t-lead">{site.closing}</p>
        <div className="ed-closing-actions">
          <MagneticButton href="/jobs" variant="dark" size="lg" arrow>Find a job</MagneticButton>
          <ActionButton href="/for-employers/post-a-job" variant="light" size="lg" arrow>Post a job</ActionButton>
        </div>
      </div>
    </section>
  </>
}
