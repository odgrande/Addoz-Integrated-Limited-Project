/**
 * ADDOZ Career Intelligence — the three tools the current ADDOZ platform exposes:
 * "Resume Scanner / ATS Checker", "Interview Questions Generator" and
 * "Cover Letter Generator" (live site: "You need to be logged in to use the AI
 * Career Tools"). Headlines and descriptions are the ADDOZ homepage copy.
 * The UI and interaction architecture are real; the AI calls come later.
 */

export type ToolSlug = "resume-scanner" | "interview-prep" | "cover-letter"

export type CareerTool = {
  slug: ToolSlug
  index: string
  name: string
  liveName: string
  detail: string
  body: string
  cta: string
  icon: "file-search" | "messages" | "pencil"
  steps: { title: string; body: string }[]
  report: string[]       // the sections the finished output will contain
}

export const careerTools: CareerTool[] = [
  {
    slug: "resume-scanner", index: "01", name: "Resume Scanner", liveName: "Resume Scanner / ATS Checker",
    detail: "Get your CV past the first look.",
    body: "Check your resume against applicant tracking systems and see where it can work harder for you.",
    cta: "Check my resume", icon: "file-search",
    steps: [
      { title: "Add your CV", body: "Upload a PDF or Word file, or paste the text." },
      { title: "Add the role", body: "Paste a job description, or pick a role from ADDOZ." },
      { title: "Read the report", body: "See how an ATS reads your CV and what to change first." },
    ],
    report: ["ATS readability", "Keyword match with the role", "Sections found", "Formatting checks", "Top improvements"],
  },
  {
    slug: "interview-prep", index: "02", name: "Interview Prep", liveName: "Interview Questions Generator",
    detail: "Walk in a little more ready.",
    body: "Explore interview questions tailored to a role, and turn preparation into confidence.",
    cta: "Prepare for my interview", icon: "messages",
    steps: [
      { title: "Choose the role", body: "Type a job title or open one from your applications." },
      { title: "Set the focus", body: "Pick question types and your experience level." },
      { title: "Practise", body: "Work through questions with notes on what a strong answer covers." },
    ],
    report: ["Role-specific questions", "Behavioural questions", "What a strong answer covers", "Questions to ask the employer"],
  },
  {
    slug: "cover-letter", index: "03", name: "Cover Letter", liveName: "Cover Letter Generator",
    detail: "Your story. Well told.",
    body: "Find the words to show an employer why you and this opportunity belong together.",
    cta: "Write my cover letter", icon: "pencil",
    steps: [
      { title: "Tell us about the role", body: "Company, job title and the description." },
      { title: "Add your story", body: "Your experience, strengths and why this role." },
      { title: "Shape the letter", body: "Choose a tone and length, then edit it in place." },
    ],
    report: ["Opening that fits the role", "Evidence from your experience", "Why this company", "A confident close"],
  },
]

export function getTool(slug: string) {
  return careerTools.find(tool => tool.slug === slug)
}
