import type { Metadata } from "next"
import { Briefcase, Building2, Globe, LifeBuoy, Mail, MapPin, Phone } from "lucide-react"
import { AppLink, PageHeader } from "@/components/patterns"
import { BrandShape } from "@/components/brand/brand-shape"
import { ContactForm } from "@/features/content/components/contact-form"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach ADDOZ by email or phone, visit the Lagos office, or send a message about a role, a job posting or the Career Intelligence tools.",
}

const routes = [
  { href: "/jobs", icon: Briefcase, title: "Job seekers", body: "Search live roles across Nigeria." },
  { href: "/for-employers", icon: Building2, title: "Employers", body: "See how posting a job on ADDOZ works." },
  { href: "/faq", icon: LifeBuoy, title: "Questions", body: "Common questions, answered in one place." },
]

export default function ContactPage() {
  return <>
    <PageHeader
      variant="editorial"
      tone="cream"
      size="lg"
      eyebrow="CONTACT"
      title="Talk to ADDOZ."
      lead="Questions about a role, a job posting, or the Career Intelligence tools — reach us directly, or send a message below."
      aside={<BrandShape name="starburst" colour="orange" className="ed-contact-shape" />}
    />
    <section className="page-section tight">
      <div className="ed-contact-grid">
        <div className="ed-contact-details">
          <ul className="card-outline ed-contact-list">
            <li className="ed-contact-item">
              <Mail size={20} aria-hidden="true" />
              <div>
                <p className="t-label">Email</p>
                <a className="text-link" href={`mailto:${site.email}`}>{site.email}</a>
              </div>
            </li>
            <li className="ed-contact-item">
              <Phone size={20} aria-hidden="true" />
              <div>
                <p className="t-label">Phone</p>
                <div className="ed-contact-stack">
                  {site.phones.map(phone => <a key={phone.href} className="text-link" href={phone.href}>{phone.display}</a>)}
                </div>
              </div>
            </li>
            <li className="ed-contact-item">
              <MapPin size={20} aria-hidden="true" />
              <div>
                <p className="t-label">{site.office.label}</p>
                <address className="ed-contact-address">
                  {site.office.lines.map(line => <span key={line}>{line}</span>)}
                </address>
              </div>
            </li>
            <li className="ed-contact-item">
              <Globe size={20} aria-hidden="true" />
              <div>
                <p className="t-label">Follow ADDOZ</p>
                <div className="ed-social-row">
                  {site.socials.map(social => <a key={social.href} className="ed-social-link" href={social.href} target="_blank" rel="noreferrer">{social.label}</a>)}
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div className="ed-contact-form-col">
          <h2 className="ed-form-heading">Send a message</h2>
          <ContactForm />
        </div>
      </div>
    </section>
    <section className="page-section tone-cream-dark tight">
      <div className="ed-route-grid">
        {routes.map(route => {
          const Icon = route.icon
          return <AppLink key={route.href} href={route.href} className="card-frame is-interactive ed-route-card">
            <Icon size={22} aria-hidden="true" />
            <strong className="ed-route-card-title">{route.title}</strong>
            <p className="t-small">{route.body}</p>
          </AppLink>
        })}
      </div>
    </section>
  </>
}
