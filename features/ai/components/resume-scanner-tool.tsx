"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { ActionButton, EmptyState, FileDrop, FormField, Panel, StatusBadge, Textarea } from "@/components/patterns"
import { careerTools, getTool } from "@/features/ai/tools"
import { AiNotConnected } from "./ai-not-connected"
import { ScreenFade } from "./screen-fade"

const tool = getTool("resume-scanner") ?? careerTools[0]

const SECTION_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Experience", pattern: /\b(work experience|professional experience|experience)\b/i },
  { label: "Education", pattern: /\b(education|academic background|qualifications)\b/i },
  { label: "Skills", pattern: /\b(skills|core competenc(?:y|ies)|technical skills)\b/i },
  { label: "Summary", pattern: /\b(summary|profile|objective|about me)\b/i },
  { label: "Contact", pattern: /\b(contact|phone number|email address)\b/i },
]

const STOPWORDS = new Set(["the", "and", "or", "a", "an", "to", "of", "in", "on", "for", "with", "is", "are", "be", "as", "at", "by", "this", "that", "from", "your", "you", "our", "we", "will", "join", "about", "into", "who", "what", "role", "job", "work", "working", "team", "teams", "across", "have", "has", "had", "its", "their", "they", "them", "also", "using", "use", "per", "new", "all", "any", "can", "but", "you'll", "you're"])

function tokenize(text: string) {
  const words = text.toLowerCase().match(/[a-z][a-z+.#-]{2,}/g) ?? []
  return Array.from(new Set(words.filter(word => !STOPWORDS.has(word))))
}

function analyseResume(cv: string, job: string) {
  const words = cv.trim().split(/\s+/).filter(Boolean)
  const sections = SECTION_PATTERNS.map(({ label, pattern }) => ({ label, found: pattern.test(cv) }))
  const hasEmail = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/.test(cv)
  const hasPhone = /(\+?\d[\d \-]{7,}\d)/.test(cv)
  const bulletCount = cv.split(/\n/).filter(line => /^\s*[•\-*–]\s+/.test(line)).length
  const wordCount = words.length
  let lengthNote = "A comfortable length for most roles."
  if (wordCount < 150) lengthNote = "On the short side — most CVs read stronger with more detail on impact and results (aim for 300–600 words)."
  else if (wordCount > 800) lengthNote = "On the long side — consider trimming to your most relevant experience (aim for one to two pages)."
  let keywords: { matched: string[]; missing: string[] } | null = null
  if (job.trim()) {
    const jobWords = tokenize(job)
    const cvWords = new Set(tokenize(cv))
    keywords = {
      matched: jobWords.filter(word => cvWords.has(word)).slice(0, 14),
      missing: jobWords.filter(word => !cvWords.has(word)).slice(0, 14),
    }
  }
  return { wordCount, sections, hasEmail, hasPhone, bulletCount, usesBullets: bulletCount >= 3, lengthNote, keywords }
}

type Result = ReturnType<typeof analyseResume>

export function ResumeScannerTool() {
  const [cvText, setCvText] = useState("")
  const [jobText, setJobText] = useState("")
  const [fileNote, setFileNote] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [touched, setTouched] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  function handleFile(file: File | null) {
    if (!file) { setFileNote(null); return }
    if (file.name.toLowerCase().endsWith(".txt")) {
      setFileNote(null)
      const reader = new FileReader()
      reader.onload = () => { if (typeof reader.result === "string") setCvText(reader.result) }
      reader.readAsText(file)
    } else {
      setFileNote("Text paste works best in the preview — this file type isn't read here. Paste the text instead.")
    }
  }

  function handleRun() {
    setTouched(true)
    if (!cvText.trim()) return
    setStatus("loading")
    window.setTimeout(() => { setResult(analyseResume(cvText, jobText)); setStatus("done") }, 500)
  }

  function handleReset() {
    setCvText(""); setJobText(""); setFileNote(null); setStatus("idle"); setTouched(false); setResult(null)
  }

  const cvError = touched && !cvText.trim() ? "Paste your CV text, or drop a .txt file, to run the checks." : null

  return (
    <div className="ci-workspace">
      <div className="ci-workspace-inputs">
        <FormField label="Your CV" hint="Paste the text of your CV — nothing leaves your browser in this preview." error={cvError} required>
          <Textarea rows={12} value={cvText} onChange={event => setCvText(event.target.value)} placeholder="Paste your CV text here…" />
        </FormField>
        <FileDrop accept=".txt" label="Or drop a .txt file" hint={fileNote ?? "Only .txt is read in this preview"} onFile={handleFile} />
        <FormField label="Job description" optional hint="Paste one in to see keyword overlap too.">
          <Textarea rows={6} value={jobText} onChange={event => setJobText(event.target.value)} placeholder="Paste the job description here…" />
        </FormField>
        <div className="ci-run-bar">
          <ActionButton type="button" variant="primary" onClick={handleRun} loading={status === "loading"}>Run checks</ActionButton>
          <ActionButton type="button" variant="ghost" icon={<RotateCcw size={16} aria-hidden="true" />} onClick={handleReset}>Reset</ActionButton>
        </div>
      </div>

      <div className="ci-workspace-results">
        <Panel title="Instant checks (run in your browser)" description="Real, deterministic checks — no AI, nothing uploaded anywhere." tone="white">
          <ScreenFade id={status === "done" ? "done" : "empty"}>
            {status === "done" && result ? (
              <>
                <div className="ci-stat-row">
                  <div className="ci-stat"><b>{result.wordCount}</b><span>Words</span></div>
                  <div className="ci-stat"><b>{result.bulletCount}</b><span>Bullet lines</span></div>
                  <div className="ci-stat"><b>{result.sections.filter(section => section.found).length}/5</b><span>Sections found</span></div>
                  <div className="ci-stat"><b>{result.hasEmail && result.hasPhone ? "Both" : result.hasEmail || result.hasPhone ? "Partly" : "Missing"}</b><span>Contact details</span></div>
                </div>
                <div className="ci-check-list">
                  {result.sections.map(section => (
                    <div className="ci-check-item" key={section.label}>
                      <span>{section.label} section</span>
                      <StatusBadge tone={section.found ? "success" : "neutral"}>{section.found ? "Found" : "Not spotted"}</StatusBadge>
                    </div>
                  ))}
                  <div className="ci-check-item"><span>Email address</span><StatusBadge tone={result.hasEmail ? "success" : "warning"}>{result.hasEmail ? "Present" : "Missing"}</StatusBadge></div>
                  <div className="ci-check-item"><span>Phone number</span><StatusBadge tone={result.hasPhone ? "success" : "warning"}>{result.hasPhone ? "Present" : "Missing"}</StatusBadge></div>
                  <div className="ci-check-item"><span>Bullet points</span><StatusBadge tone={result.usesBullets ? "success" : "neutral"}>{result.usesBullets ? `${result.bulletCount} used` : "Few or none"}</StatusBadge></div>
                </div>
                <p className="ci-note-block"><strong>Length: </strong>{result.lengthNote}</p>
                {result.keywords ? (
                  <>
                    <div className="ci-keyword-group">
                      <h4>Matches the job description ({result.keywords.matched.length})</h4>
                      <div className="ci-keyword-list">
                        {result.keywords.matched.length
                          ? result.keywords.matched.map(word => <span key={word} className="ci-keyword-chip is-match">{word}</span>)
                          : <span className="ci-keyword-chip is-missing">No shared keywords found</span>}
                      </div>
                    </div>
                    <div className="ci-keyword-group">
                      <h4>Missing from your CV ({result.keywords.missing.length})</h4>
                      <div className="ci-keyword-list">
                        {result.keywords.missing.length
                          ? result.keywords.missing.map(word => <span key={word} className="ci-keyword-chip is-missing">{word}</span>)
                          : <span className="ci-keyword-chip is-match">Nothing obvious missing</span>}
                      </div>
                    </div>
                  </>
                ) : <p className="ci-note-block">Paste a job description on the left and run checks again to see keyword overlap.</p>}
              </>
            ) : (
              <EmptyState title="Add your CV to see instant checks" body="Paste your CV text on the left, or drop a .txt file, then select Run checks." />
            )}
          </ScreenFade>
        </Panel>

        <AiNotConnected label="AI analysis — not connected in this preview" sections={tool.report} />
      </div>
    </div>
  )
}
