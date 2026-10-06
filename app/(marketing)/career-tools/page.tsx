import type { Metadata } from "next"
import { ArrowUpRight, FileSearch, MessagesSquare, Pencil, Search } from "lucide-react"
import { ActionButton, AppLink, PageHeader, PrototypeNote, Reveal, SectionHeading } from "@/components/patterns"
import { BrandShape } from "@/components/brand/brand-shape"
import { ToolConsole } from "@/features/ai/components/tool-console"
import { careerTools } from "@/features/ai/tools"

export const metadata: Metadata = {
  title: "Career Intelligence",
  description: "Resume Scanner, Interview Prep and Cover Letter — one console of tools to help you apply with a little extra edge.",
}

const toolIcons = { "file-search": FileSearch, messages: MessagesSquare, pencil: Pencil }

export default function CareerToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="ADDOZ CAREER INTELLIGENCE"
        variant="editorial"
        tone="purple"
        title={<>A little extra edge.<br className="desktop-break" /> A lot more you.</>}
        lead="Three tools built around one job search: check your CV, prepare for the room, and put your story into words — then bring it all to a real application on ADDOZ."
      />

      <section className="page-section tone-white ci-shape-host">
        <BrandShape name="sparkles" colour="purple" className="ci-deco-shape" />
        <SectionHeading eyebrow="ONE PRODUCT, THREE TOOLS" title="Your career console" lead="Switch tabs to see how each tool works and what its report covers." />
        <ToolConsole />
      </section>

      <section className="page-section tone-cream-dark tight">
        <SectionHeading eyebrow="HOW IT WORKS" title="The same three beats, every time" />
        <Reveal className="ci-flow" mode="scroll">
          <div className="ci-flow-step">
            <p className="ci-flow-num tabular">01</p>
            <h3>Pick your tool</h3>
            <p>Resume Scanner, Interview Prep or Cover Letter — start with whichever matches what&apos;s in front of you today.</p>
          </div>
          <div className="ci-flow-step">
            <p className="ci-flow-num tabular">02</p>
            <h3>Add what you&apos;re working with</h3>
            <p>Paste your CV, describe the role, or tell us about yourself in your own words. The instant checks run in your browser — nothing is uploaded.</p>
          </div>
          <div className="ci-flow-step">
            <p className="ci-flow-num tabular">03</p>
            <h3>Get an honest result</h3>
            <p>Instant, deterministic checks you can act on today — and the fuller AI-tailored report once you&apos;re signed in on the live platform.</p>
          </div>
        </Reveal>
      </section>

      <section className="page-section tone-white">
        <SectionHeading eyebrow="BUILT INTO YOUR JOB SEARCH" title="From a role to a ready application" lead="Every tool here is built to sit alongside a real application on ADDOZ." />
        <div className="ci-links">
          <AppLink href="/jobs" className="card-frame is-interactive ci-link-card">
            <span className="ci-link-icon" aria-hidden="true"><Search size={20} /></span>
            <h3>Find a role</h3>
            <p>Search open roles across Nigeria, then bring the details here.</p>
            <span className="ci-link-arrow">Browse jobs <ArrowUpRight size={14} aria-hidden="true" /></span>
          </AppLink>
          {careerTools.map(tool => {
            const Icon = toolIcons[tool.icon]
            return (
              <AppLink key={tool.slug} href={`/career-tools/${tool.slug}`} className="card-frame is-interactive ci-link-card">
                <span className="ci-link-icon" aria-hidden="true"><Icon size={20} /></span>
                <h3>{tool.name}</h3>
                <p>{tool.detail}</p>
                <span className="ci-link-arrow">Open tool <ArrowUpRight size={14} aria-hidden="true" /></span>
              </AppLink>
            )
          })}
        </div>
      </section>

      <section className="page-section tone-white tight">
        <PrototypeNote title="AI analysis is coming soon">The instant checks in each tool work today. Personalised AI analysis of your CV, cover letters and interview answers is being added next — subscribe below to hear when it launches.</PrototypeNote>
      </section>

      <section className="page-section tone-cream-dark ci-shape-host">
        <BrandShape name="orbit" colour="purple" className="ci-deco-shape" />
        <SectionHeading eyebrow="GET STARTED" title="Choose your next step" />
        <div className="ci-cta-grid">
          {careerTools.map(tool => (
            <div key={tool.slug} className="card-frame ci-cta-card">
              <p className="ci-cta-index tabular">{tool.index}</p>
              <h3>{tool.name}</h3>
              <p>{tool.body}</p>
              <ActionButton href={`/career-tools/${tool.slug}`} variant="primary" arrow>{tool.cta}</ActionButton>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
