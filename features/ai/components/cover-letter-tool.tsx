"use client"

import { useState } from "react"
import { Copy, RotateCcw } from "lucide-react"
import { ActionButton, EmptyState, FieldRow, FormField, Input, Panel, Select, Textarea, useToast } from "@/components/patterns"
import { careerTools, getTool } from "@/features/ai/tools"
import { AiNotConnected } from "./ai-not-connected"
import { ScreenFade } from "./screen-fade"

const tool = getTool("cover-letter") ?? careerTools[2]

type Tone = "professional" | "warm" | "direct"

const tones: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "warm", label: "Warm & personal" },
  { value: "direct", label: "Confident & direct" },
]

function joinStrengths(strengths: string[]) {
  if (strengths.length === 0) return ""
  if (strengths.length === 1) return strengths[0]
  if (strengths.length === 2) return `${strengths[0]} and ${strengths[1]}`
  return `${strengths.slice(0, -1).join(", ")} and ${strengths[strengths.length - 1]}`
}

function buildLetter(input: { name: string; company: string; role: string; why: string; strengths: string[]; tone: Tone }) {
  const { name, company, role, why, strengths, tone } = input
  const paragraphs: string[] = []

  const opener = tone === "warm"
    ? `I'm excited to apply for the ${role} role at ${company}.`
    : tone === "direct"
      ? `I'm applying for the ${role} role at ${company}, and I believe I'm a strong fit.`
      : `I am writing to apply for the ${role} position at ${company}.`
  paragraphs.push(opener)

  if (why.trim()) paragraphs.push(why.trim())

  if (strengths.length) {
    const joined = joinStrengths(strengths)
    const bridge = tone === "warm"
      ? "I'd love the chance to bring these to your team."
      : tone === "direct"
        ? "I am confident these would let me contribute from day one."
        : "These are strengths I have applied consistently throughout my career."
    paragraphs.push(`I bring ${joined} to this role. ${bridge}`)
  }

  const closer = tone === "warm"
    ? `I'd love the chance to talk more about how I could contribute to ${company}. Thank you for taking the time to consider my application.`
    : tone === "direct"
      ? `I'd welcome a conversation about how I can add value at ${company} right away. Thank you for your time and consideration.`
      : `I would welcome the opportunity to discuss how I can contribute to ${company}. Thank you for considering my application.`
  paragraphs.push(closer)

  const salutation = `Dear ${company ? `${company} Hiring Team` : "Hiring Manager"},`
  return [salutation, "", ...paragraphs.flatMap(paragraph => [paragraph, ""]), "Yours sincerely,", name].join("\n").replace(/\n{3,}/g, "\n\n")
}

export function CoverLetterTool() {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [why, setWhy] = useState("")
  const [strength1, setStrength1] = useState("")
  const [strength2, setStrength2] = useState("")
  const [strength3, setStrength3] = useState("")
  const [tone, setTone] = useState<Tone>("professional")
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [touched, setTouched] = useState(false)
  const [draft, setDraft] = useState("")
  const toast = useToast()

  const errors = {
    name: touched && !name.trim() ? "Add your name." : null,
    company: touched && !company.trim() ? "Add the company name." : null,
    role: touched && !role.trim() ? "Add the role you're applying for." : null,
  }

  function handleRun() {
    setTouched(true)
    if (!name.trim() || !company.trim() || !role.trim()) return
    setStatus("loading")
    const strengths = [strength1, strength2, strength3].map(value => value.trim()).filter(Boolean)
    window.setTimeout(() => {
      setDraft(buildLetter({ name: name.trim(), company: company.trim(), role: role.trim(), why, strengths, tone }))
      setStatus("done")
    }, 450)
  }

  function handleReset() {
    setName(""); setCompany(""); setRole(""); setWhy(""); setStrength1(""); setStrength2(""); setStrength3("")
    setTone("professional"); setStatus("idle"); setTouched(false); setDraft("")
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft)
      toast({ title: "Copied to clipboard", tone: "success" })
    } catch {
      toast({ title: "Couldn't copy automatically", body: "Select the text in the box and copy it manually.", tone: "error" })
    }
  }

  return (
    <div className="ci-workspace">
      <div className="ci-workspace-inputs">
        <FieldRow columns={2}>
          <FormField label="Your name" error={errors.name} required>
            <Input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Amaka Okafor" />
          </FormField>
          <FormField label="Company" error={errors.company} required>
            <Input value={company} onChange={event => setCompany(event.target.value)} placeholder="e.g. Sample Creative Studio" />
          </FormField>
        </FieldRow>
        <FormField label="Role" error={errors.role} required>
          <Input value={role} onChange={event => setRole(event.target.value)} placeholder="e.g. Product Designer" />
        </FormField>
        <FormField label="Why this role" optional hint="A sentence or two in your own words — it goes straight into the letter.">
          <Textarea rows={3} value={why} onChange={event => setWhy(event.target.value)} placeholder="Why this role, and why now?" />
        </FormField>
        <FieldRow columns={3}>
          <FormField label="Strength 1" optional><Input value={strength1} onChange={event => setStrength1(event.target.value)} placeholder="e.g. attention to detail" /></FormField>
          <FormField label="Strength 2" optional><Input value={strength2} onChange={event => setStrength2(event.target.value)} placeholder="e.g. leading small teams" /></FormField>
          <FormField label="Strength 3" optional><Input value={strength3} onChange={event => setStrength3(event.target.value)} placeholder="e.g. clear writing" /></FormField>
        </FieldRow>
        <FormField label="Tone">
          <Select value={tone} onChange={event => setTone(event.target.value as Tone)}>
            {tones.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </FormField>
        <div className="ci-run-bar">
          <ActionButton type="button" variant="primary" onClick={handleRun} loading={status === "loading"}>Draft my letter</ActionButton>
          <ActionButton type="button" variant="ghost" icon={<RotateCcw size={16} aria-hidden="true" />} onClick={handleReset}>Reset</ActionButton>
        </div>
      </div>

      <div className="ci-workspace-results">
        <Panel title="Draft from your own words" description="Built from what you typed, using a fixed template — not AI." tone="white">
          <ScreenFade id={status === "done" ? "done" : "empty"}>
            {status === "done" ? (
              <>
                <Textarea className="ci-letter-textarea" value={draft} onChange={event => setDraft(event.target.value)} aria-label="Your draft cover letter, editable" />
                <div className="ci-letter-actions">
                  <ActionButton type="button" variant="dark" icon={<Copy size={16} aria-hidden="true" />} onClick={handleCopy}>Copy to clipboard</ActionButton>
                </div>
              </>
            ) : (
              <EmptyState title="Add your details to draft a letter" body="Fill in your name, the company and the role on the left, then select Draft my letter." />
            )}
          </ScreenFade>
        </Panel>

        <AiNotConnected label="AI-enhanced draft — coming soon" sections={tool.report} />
      </div>
    </div>
  )
}
