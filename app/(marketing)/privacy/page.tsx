import type { Metadata } from "next"
import { LegalPage, type LegalSection } from "@/features/content/components/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ADDOZ will handle personal information across the platform — an outline of what the published privacy policy will cover.",
}

const sections: LegalSection[] = [
  { id: "who-this-covers", heading: "Who this policy covers", summary: "Which visitors, job seekers and employers this policy applies to, across the ADDOZ website and platform — exact wording will follow legal review." },
  { id: "information-we-collect", heading: "Information we collect", summary: "The categories of information ADDOZ may collect, such as profile, application and job-posting details — exact wording will follow legal review." },
  { id: "how-we-use-information", heading: "How we use information", summary: "The purposes information is used for, such as operating the platform, matching roles and responding to enquiries — exact wording will follow legal review." },
  { id: "cookies", heading: "Cookies and similar technologies", summary: "Whether and how cookies or similar technologies are used on the site, and the choices available to you — exact wording will follow legal review." },
  { id: "sharing-and-disclosure", heading: "Sharing and disclosure", summary: "The circumstances in which information may be shared, such as with an employer whose role you apply to — exact wording will follow legal review." },
  { id: "data-retention", heading: "Data retention", summary: "How long different types of information are kept, and how that is decided — exact wording will follow legal review." },
  { id: "your-rights-and-choices", heading: "Your rights and choices", summary: "The choices available to you over your own information, including how to ask about, correct or remove it — exact wording will follow legal review." },
  { id: "keeping-information-secure", heading: "Keeping information secure", summary: "The general approach ADDOZ takes to protecting the information it holds — exact wording will follow legal review." },
  { id: "childrens-privacy", heading: "Children’s privacy", summary: "ADDOZ’s position on use of the platform by children, and what happens if a child’s information is identified — exact wording will follow legal review." },
  { id: "changes-to-this-policy", heading: "Changes to this policy", summary: "How ADDOZ will let you know if this policy changes once it is published — exact wording will follow legal review." },
]

export default function PrivacyPage() {
  return <LegalPage
    eyebrow="PRIVACY"
    title="Privacy Policy"
    intro="How ADDOZ collects, uses and protects information across the platform. This page sets out the outline while the full policy is finalised."
    sections={sections}
  />
}
