import type { Metadata } from "next"
import Image from "next/image"
import { ArrowRight, Briefcase, CalendarClock, Clock, FileText, Tags, Wallet } from "lucide-react"
import { ActionButton, MagneticButton, Reveal, SampleTag, SectionHeading } from "@/components/patterns"
import { ScrambleLabel } from "@/components/addoz/scramble-label"
import { employerProposition, testimonials } from "@/features/content/testimonials"

export const metadata: Metadata = {
  title: "For employers",
  description: "Post a job for free on ADDOZ and reach jobseekers across Nigeria — see how posting, browsing talent and managing applications works.",
}

const grace = testimonials.find(item => item.name === "Grace Nwachukwu")
const applicantSteps = ["Applications arrive", "Review", "Shortlist", "Interview", "Hire"]

export default function ForEmployersPage() {
  return <>
    <section className="page-section fe-hero">
      <div className="fe-hero-grid">
        <div className="fe-hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /><ScrambleLabel text="FOR EMPLOYERS" /></p>
          <h1 className="t-h1" data-reveal>{employerProposition.heading}</h1>
          <p className="page-header-lead">{employerProposition.sub}</p>
          <div className="cluster">
            <MagneticButton href="/for-employers/post-a-job" variant="primary" size="lg" arrow>{employerProposition.cta}</MagneticButton>
            <ActionButton href="/auth/login?role=employer" variant="light" size="lg">Employer sign in</ActionButton>
          </div>
        </div>
        <div className="fe-hero-media">
          <figure className="fe-hero-photo">
            <Image src="/images/team-editorial.png" alt="Nigerian professionals sharing ideas around a studio table" fill sizes="(max-width: 1023px) 92vw, 44vw" />
          </figure>
        </div>
      </div>
    </section>

    <section className="page-section tone-yellow">
      <SectionHeading eyebrow="WHY ADDOZ" title="Everything you need to hire well" />
      <ol className="fe-benefits">
        {employerProposition.benefits.map((benefit, index) => <li key={benefit.title} className="fe-benefit">
          <span className="fe-benefit-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="t-h3">{benefit.title}</h3>
          <p className="t-body">{benefit.body}</p>
        </li>)}
      </ol>
    </section>

    <section className="page-section tone-cream-dark">
      <SectionHeading eyebrow="HOW IT WORKS" title="Your hiring workflow" lead="From posting a role to making an offer, every step happens on ADDOZ." />
      <Reveal mode="scroll">
        <ol className="fe-track">
          {employerProposition.steps.map((step, index) => <li key={step} className="fe-track-step">
            <span className="fe-track-num" aria-hidden="true">{index + 1}</span>
            <p className="fe-track-label">{step}</p>
            {index < employerProposition.steps.length - 1 && <span className="fe-track-arrow" aria-hidden="true"><ArrowRight size={18} /></span>}
          </li>)}
        </ol>
      </Reveal>
    </section>

    <section className="page-section">
      <SectionHeading eyebrow="THE FORM" title="Posting a job takes minutes" lead="One form covers everything a candidate needs to decide whether to apply." />
      <div className="fe-posting-grid">
        <ul className="fe-form-summary">
          <li><Briefcase size={18} aria-hidden="true" /> Role, category and location</li>
          <li><Clock size={18} aria-hidden="true" /> Employment type and experience level</li>
          <li><Wallet size={18} aria-hidden="true" /> Salary — shown or kept private</li>
          <li><FileText size={18} aria-hidden="true" /> Description and requirements</li>
          <li><Tags size={18} aria-hidden="true" /> Key skills candidates should have</li>
          <li><CalendarClock size={18} aria-hidden="true" /> Closing date and how to apply</li>
        </ul>
        <div className="fe-posting-preview">
          <p className="fe-posting-preview-label t-label">How it looks to candidates <SampleTag /></p>
          <article className="job-card" aria-label="Sample listing preview">
            <div className="job-card-head">
              <span className="job-mark mark-yellow" aria-hidden="true">F</span>
              <p className="job-card-company"><span>Sample Company Ltd</span><span>Lagos · On-site</span></p>
            </div>
            <h3 className="job-card-title">Finance Officer</h3>
            <p className="job-card-meta"><span>Finance &amp; Accounting</span><span>Full-time</span><span>Mid level</span></p>
            <p className="job-card-skills"><span>Excel</span><span>Bookkeeping</span><span>Reporting</span></p>
            <div className="job-card-foot">
              <span className="job-salary tabular">₦180,000 – ₦250,000</span>
              <span className="job-posted">Closes in 30 days</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section className="page-section">
      <SectionHeading className="fe-heading-tight" eyebrow="DISCOVERY" title="Finding talent" lead="See where candidates are concentrated before you post." />
      <p className="t-body fe-copy">The same categories and locations candidates search by can help you plan a listing — browse ADDOZ&apos;s categories and locations to see the roles and regions with the most activity.</p>
      <div className="cluster">
        <ActionButton href="/categories" variant="light" arrow>Browse categories</ActionButton>
        <ActionButton href="/locations" variant="light" arrow>Browse locations</ActionButton>
      </div>
    </section>

    <section className="page-section tone-purple fe-manage">
      <SectionHeading className="fe-heading-tight" eyebrow="AFTER YOU POST" title="Applicant management" lead="Applications land in one place, so nothing gets lost in an inbox." />
      <ol className="fe-flow">
        {applicantSteps.map((label, index) => <li key={label} className="fe-flow-step">
          <span className="fe-flow-chip">{label}</span>
          {index < applicantSteps.length - 1 && <ArrowRight size={16} aria-hidden="true" className="fe-flow-arrow" />}
        </li>)}
      </ol>
      <p className="t-body fe-copy">In the employer dashboard, applications arrive against your listing so you can review, shortlist, interview and hire — all from one place.</p>
    </section>

    {grace && <section className="page-section">
      <SectionHeading eyebrow="FROM AN EMPLOYER" title="What hiring on ADDOZ is like" />
      <figure className="fe-testimonial card-outline">
        <blockquote className="t-h3 fe-testimonial-quote">&ldquo;{grace.quote}&rdquo;</blockquote>
        <figcaption className="fe-testimonial-name">{grace.name}<span className="fe-testimonial-role">{grace.role}</span></figcaption>
      </figure>
    </section>}

    <section className="page-section tone-black fe-closing">
      <h2 className="t-h2-statement" data-reveal>Ready to find your next hire?</h2>
      <p className="t-lead">{employerProposition.cta} — it takes about two minutes.</p>
      <ActionButton href="/for-employers/post-a-job" variant="yellow" size="lg" arrow>{employerProposition.cta}</ActionButton>
    </section>
  </>
}
