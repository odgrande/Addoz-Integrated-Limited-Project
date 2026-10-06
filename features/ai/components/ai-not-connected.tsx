import { Panel } from "@/components/patterns"

/**
 * The one honest way every Career Intelligence tool shows what the signed-in,
 * AI-tailored report will contain: the real section names from the tool's data,
 * laid out as empty rows — never fabricated output.
 */
export function AiNotConnected({ label, sections, note = "Personalised AI analysis is coming soon. The instant checks above work today." }: {
  label: string
  sections: string[]
  note?: string
}) {
  return (
    <Panel title={label} description={note} tone="cream" className="ci-ai-panel">
      <div className="ci-skeleton">
        {sections.map(section => (
          <div key={section} className="ci-skeleton-row">
            <span className="ci-skeleton-label">{section}</span>
            <span className="ci-skeleton-bar" aria-hidden="true" />
          </div>
        ))}
      </div>
    </Panel>
  )
}
