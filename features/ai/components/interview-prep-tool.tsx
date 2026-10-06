"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { ActionButton, Checkbox, EmptyState, FormField, Input, Panel, Select, SegmentTabs } from "@/components/patterns"
import { careerTools, getTool } from "@/features/ai/tools"
import { AiNotConnected } from "./ai-not-connected"
import { ScreenFade } from "./screen-fade"

const tool = getTool("interview-prep") ?? careerTools[1]

type Level = "graduate" | "junior" | "mid" | "senior"
type Focus = "behavioural" | "role-specific" | "questions"

const levels: { value: Level; label: string }[] = [
  { value: "graduate", label: "No experience / graduate" },
  { value: "junior", label: "1–3 years" },
  { value: "mid", label: "3–7 years" },
  { value: "senior", label: "7+ years / leadership" },
]

const levelNote: Record<Level, string> = {
  graduate: "With little or no paid experience yet, draw your examples from coursework, projects, internships or volunteering — the structure below works just as well.",
  junior: "A couple of solid, specific examples will do more for you here than trying to cover everything you've ever worked on.",
  mid: "Interviewers at this level expect you to speak to trade-offs you made, not just tasks you completed.",
  senior: "Pair every example with its wider impact — what changed for the team or the business, not only the task itself.",
}

const checklistItems = [
  "Research the company and the role",
  "Prepare three STAR stories",
  "Prepare two or three questions to ask",
  "Plan your route, or test your setup for a video call",
  "Read back through your CV so nothing surprises you",
]

type GuideSection = { heading: string; paragraphs: string[]; list?: string[] }

function buildGuide(role: string, level: Level, focus: Focus): GuideSection[] {
  const roleLabel = role.trim() || "role"
  if (focus === "behavioural") {
    return [
      {
        heading: "Use the STAR method",
        paragraphs: ["Structure every answer as Situation, Task, Action, Result. Interviewers are mostly listening for the Action and the Result — be specific about what you did and what changed because of it."],
        list: ["Situation — one or two sentences of context", "Task — what you were responsible for", "Action — the specific steps you took", "Result — the outcome, ideally with a number"],
      },
      {
        heading: "What interviewers are listening for",
        paragraphs: ["Most interviewers are weighing the same few things, whatever the question:"],
        list: ["Ownership — you speaking about what you did, not just what the team did", "A specific example, not a general statement", "A real result, described honestly", "Reflection — what you'd repeat or do differently"],
      },
      {
        heading: `Prepare a story for each of these before your ${roleLabel} interview`,
        paragraphs: [],
        list: ["A time you worked well with others under pressure", "A disagreement you helped resolve", "A mistake or setback, and what you learned from it", "A time you took the lead on something", "A tight deadline you met"],
      },
    ]
  }
  if (focus === "role-specific") {
    return [
      {
        heading: "Start from the job description",
        paragraphs: [`Re-read the ${roleLabel} job description line by line and underline every skill or responsibility it names. Each one is a strong hint about what you'll be asked.`],
      },
      {
        heading: "Match your experience to each line",
        paragraphs: ["For every requirement you underlined, prepare one concrete example that shows you can do it — a project, a result, a piece of work you can describe in under two minutes."],
      },
      {
        heading: "Prepare questions of your own",
        paragraphs: ["Role-specific interviews go both ways. Two or three thoughtful questions about the day-to-day work show you've thought seriously about the role, not just the title."],
      },
    ]
  }
  return [
    {
      heading: "About the role",
      paragraphs: ["Good questions show you're evaluating the role as carefully as they're evaluating you. Pick two or three that fit the conversation naturally."],
      list: ["What does success look like in this role in the first 90 days?", "What's the biggest challenge someone in this role would face right now?", "What does a typical week actually look like?"],
    },
    {
      heading: "About the team",
      paragraphs: [],
      list: ["How is the team structured, and who would I work with most closely?", "How does the team measure its own success?"],
    },
    {
      heading: "About growth",
      paragraphs: [],
      list: ["What does progression look like from here?", "How is performance reviewed, and how often?"],
    },
  ]
}

export function InterviewPrepTool() {
  const [role, setRole] = useState("")
  const [level, setLevel] = useState<Level>("junior")
  const [focus, setFocus] = useState<Focus>("behavioural")
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [touched, setTouched] = useState(false)
  const [guide, setGuide] = useState<GuideSection[] | null>(null)
  const [checked, setChecked] = useState<boolean[]>(() => checklistItems.map(() => false))

  function handleRun() {
    setTouched(true)
    if (!role.trim()) return
    setStatus("loading")
    window.setTimeout(() => { setGuide(buildGuide(role, level, focus)); setStatus("done") }, 450)
  }

  function handleReset() {
    setRole(""); setLevel("junior"); setFocus("behavioural"); setStatus("idle"); setTouched(false); setGuide(null); setChecked(checklistItems.map(() => false))
  }

  const roleError = touched && !role.trim() ? "Add a role to build your practice guide." : null
  const doneCount = checked.filter(Boolean).length

  return (
    <div className="ci-workspace">
      <div className="ci-workspace-inputs">
        <FormField label="Role" hint="The job title you're interviewing for." error={roleError} required>
          <Input value={role} onChange={event => setRole(event.target.value)} placeholder="e.g. Product Designer" />
        </FormField>
        <FormField label="Experience level">
          <Select value={level} onChange={event => setLevel(event.target.value as Level)}>
            {levels.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Focus">
          <SegmentTabs<Focus>
            label="Focus"
            value={focus}
            onChange={setFocus}
            options={[
              { value: "behavioural", label: "Behavioural" },
              { value: "role-specific", label: "Role-specific" },
              { value: "questions", label: "Questions to ask" },
            ]}
          />
        </FormField>
        <div className="ci-run-bar">
          <ActionButton type="button" variant="primary" onClick={handleRun} loading={status === "loading"}>Build my practice guide</ActionButton>
          <ActionButton type="button" variant="ghost" icon={<RotateCcw size={16} aria-hidden="true" />} onClick={handleReset}>Reset</ActionButton>
        </div>
      </div>

      <div className="ci-workspace-results">
        <Panel title="Practice guide" description="Generic, honest guidance we've written for every candidate — not personalised, not AI." tone="white">
          <ScreenFade id={status === "done" ? "done" : "empty"}>
            {status === "done" && guide ? (
              <div className="ci-guide">
                <p>{levelNote[level]}</p>
                {guide.map(section => (
                  <div key={section.heading}>
                    <h3>{section.heading}</h3>
                    {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                    {section.list && <ul className="ci-guide-list">{section.list.map(item => <li key={item}>{item}</li>)}</ul>}
                  </div>
                ))}
                <h3>Before you go in</h3>
                <p className="ci-checklist-progress">{doneCount} of {checklistItems.length} done</p>
                <div className="ci-checklist" role="group" aria-label="Before you go in checklist">
                  {checklistItems.map((item, index) => (
                    <Checkbox
                      key={item}
                      label={item}
                      checked={checked[index]}
                      onChange={() => setChecked(list => list.map((value, i) => i === index ? !value : value))}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Add a role to build your guide" body="Fill in the role, level and focus on the left, then select Build my practice guide." />
            )}
          </ScreenFade>
        </Panel>

        <AiNotConnected label="AI-tailored questions — coming soon" sections={tool.report} />
      </div>
    </div>
  )
}
