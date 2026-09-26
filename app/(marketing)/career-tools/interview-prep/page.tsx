import type { Metadata } from "next"
import { PageHeader, SectionHeading } from "@/components/patterns"
import { InterviewPrepTool } from "@/features/ai/components/interview-prep-tool"
import { ToolCrossLinks } from "@/features/ai/components/tool-cross-links"
import { careerTools, getTool } from "@/features/ai/tools"

const tool = getTool("interview-prep") ?? careerTools[1]

export const metadata: Metadata = {
  title: tool.name,
  description: `${tool.detail} ${tool.body}`,
}

export default function InterviewPrepPage() {
  return (
    <>
      <PageHeader
        eyebrow={`CAREER INTELLIGENCE · ${tool.index}`}
        title={tool.name}
        lead={tool.body}
        crumbs={[{ label: "Career Intelligence", href: "/career-tools" }, { label: tool.name }]}
      />

      <section className="page-section tone-white">
        <InterviewPrepTool />
      </section>

      <section className="page-section tone-cream-dark tight">
        <SectionHeading eyebrow="KEEP GOING" title="More from Career Intelligence" />
        <ToolCrossLinks current="interview-prep" />
      </section>
    </>
  )
}
