import type { Metadata } from "next"
import { PageHeader, SectionHeading } from "@/components/patterns"
import { ResumeScannerTool } from "@/features/ai/components/resume-scanner-tool"
import { ToolCrossLinks } from "@/features/ai/components/tool-cross-links"
import { careerTools, getTool } from "@/features/ai/tools"

const tool = getTool("resume-scanner") ?? careerTools[0]

export const metadata: Metadata = {
  title: tool.name,
  description: `${tool.detail} ${tool.body}`,
}

export default function ResumeScannerPage() {
  return (
    <>
      <PageHeader
        eyebrow={`CAREER INTELLIGENCE · ${tool.index}`}
        title={tool.name}
        lead={tool.body}
        crumbs={[{ label: "Career Intelligence", href: "/career-tools" }, { label: tool.name }]}
      />

      <section className="page-section tone-white">
        <ResumeScannerTool />
      </section>

      <section className="page-section tone-cream-dark tight">
        <SectionHeading eyebrow="KEEP GOING" title="More from Career Intelligence" />
        <ToolCrossLinks current="resume-scanner" />
      </section>
    </>
  )
}
