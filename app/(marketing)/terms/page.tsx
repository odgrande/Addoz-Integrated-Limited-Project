import type { Metadata } from "next"
import { LegalPage, type LegalSection } from "@/features/content/components/legal-page"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using the ADDOZ platform — an outline of what the published terms of service will cover.",
}

const sections: LegalSection[] = [
  { id: "acceptance", heading: "Acceptance of these terms", summary: "What it means to use the ADDOZ platform and agree to these terms — exact wording will follow legal review." },
  { id: "accounts-and-eligibility", heading: "Accounts and eligibility", summary: "Who can create an ADDOZ account, and your responsibilities for keeping it secure — exact wording will follow legal review." },
  { id: "using-addoz-as-a-job-seeker", heading: "Using ADDOZ as a job seeker", summary: "What searching, saving and applying for roles through ADDOZ involves — exact wording will follow legal review." },
  { id: "using-addoz-as-an-employer", heading: "Using ADDOZ as an employer", summary: "What posting jobs and reviewing applications through ADDOZ involves — exact wording will follow legal review." },
  { id: "acceptable-use", heading: "Acceptable use", summary: "The kind of content and behaviour that is, and isn’t, allowed on the platform — exact wording will follow legal review." },
  { id: "intellectual-property", heading: "Intellectual property", summary: "Who owns the ADDOZ platform and its content, and the material you submit to it — exact wording will follow legal review." },
  { id: "career-intelligence-tools", heading: "Career Intelligence tools", summary: "The basis on which the AI-assisted Career Intelligence tools are provided — exact wording will follow legal review." },
  { id: "disclaimers-and-liability", heading: "Disclaimers and liability", summary: "The limits of what ADDOZ promises about the platform and any outcomes from using it — exact wording will follow legal review." },
  { id: "suspending-or-ending-access", heading: "Suspending or ending access", summary: "The circumstances in which access to an account may be suspended or ended — exact wording will follow legal review." },
  { id: "governing-law", heading: "Governing law and disputes", summary: "Which law applies to these terms and how a dispute would be resolved — exact wording will follow legal review." },
  { id: "changes-to-these-terms", heading: "Changes to these terms", summary: "How ADDOZ will let you know if these terms change once they are published — exact wording will follow legal review." },
]

export default function TermsPage() {
  return <LegalPage
    eyebrow="TERMS"
    title="Terms of Service"
    intro="The rules for using the ADDOZ platform, for job seekers and employers alike. This page sets out the outline while the full terms are finalised."
    sections={sections}
  />
}
