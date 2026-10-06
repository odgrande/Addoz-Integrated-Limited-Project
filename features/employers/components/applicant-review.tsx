"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, ChevronDown, FileText, Search } from "lucide-react"
import { matchBands, type MatchBand, type MatchResult } from "@/features/applications/matching"
import { SaveApplicantButton } from "@/features/employers/components/applicant-contact"
import { StageSelect } from "@/features/employers/components/employer-ui"
import { employerStages } from "@/features/employers/stages"
import { MessageButton } from "@/features/messages/components/messages-ui"

export type ReviewApplicant = {
  id: string
  candidateName: string
  candidateEmail: string
  candidatePhone: string | null
  headline: string | null
  locationName: string | null
  stage: string | null
  appliedAt: string
  coverLetter: string | null
  resumeFileName: string | null
  resumeUrl: string | null
  match: MatchResult
}

type BandFilter = "all" | MatchBand
type Sort = "match" | "newest" | "oldest"

const bandLabel: Record<MatchBand, string> = { top: "Top match", good: "Good match", fair: "Fair match", low: "Low match", unscored: "Not scored" }
const day = (value: string) => new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })

/**
 * Per-job applicant review. Every applicant carries a match score against the
 * job's skills, requirements and experience, so an employer facing hundreds of
 * applications can work band by band: open "Top match", shortlist them in one
 * go, then move on to the next band (or decline the rest) until the pile is done.
 */
export function ApplicantReview({ applicants, jobSkills, savedIds }: { applicants: ReviewApplicant[]; jobSkills: string[]; /** null until saved applicants is available */ savedIds: string[] | null }) {
  const router = useRouter()
  const [band, setBand] = useState<BandFilter>("all")
  const [stage, setStage] = useState("")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort>("match")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStage, setBulkStage] = useState("Shortlisted")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  const counts = useMemo(() => {
    const result: Record<BandFilter, number> = { all: applicants.length, top: 0, good: 0, fair: 0, low: 0, unscored: 0 }
    for (const item of applicants) result[item.match.band] += 1
    return result
  }, [applicants])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return applicants
      .filter(item => band === "all" || item.match.band === band)
      .filter(item => !stage || (item.stage ?? "Applied") === stage)
      .filter(item => !needle || [item.candidateName, item.candidateEmail, item.headline ?? "", ...item.match.matchedSkills].some(value => value.toLowerCase().includes(needle)))
      .sort((a, b) => sort === "match" ? (b.match.score - a.match.score) || (Date.parse(b.appliedAt) - Date.parse(a.appliedAt))
        : sort === "newest" ? Date.parse(b.appliedAt) - Date.parse(a.appliedAt) : Date.parse(a.appliedAt) - Date.parse(b.appliedAt))
  }, [applicants, band, stage, query, sort])

  const visibleIds = visible.map(item => item.id)
  const chosen = visibleIds.filter(id => selected.has(id))
  const allChosen = visible.length > 0 && chosen.length === visible.length

  function toggle(id: string) {
    setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }
  function toggleAll() {
    setSelected(current => { const next = new Set(current); for (const id of visibleIds) { if (allChosen) next.delete(id); else next.add(id) } return next })
  }

  async function moveSelected() {
    if (!chosen.length) return
    setBusy(true); setMessage("")
    try {
      const response = await fetch("/api/employer/applications/bulk", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: chosen, stage: bulkStage }) })
      const payload = await response.json().catch(() => ({})) as { error?: string; updated?: number }
      if (!response.ok) throw new Error(payload.error || "Unable to update these applicants.")
      setMessage(`${payload.updated ?? chosen.length} applicant${(payload.updated ?? chosen.length) === 1 ? "" : "s"} moved to ${bulkStage}.`)
      setSelected(new Set())
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update these applicants.")
    } finally { setBusy(false) }
  }

  const bandTabs: BandFilter[] = ["all", ...matchBands.map(item => item.id), ...(counts.unscored ? ["unscored" as const] : [])]

  return <div className="applicant-review">
    <nav className="match-bands" aria-label="Filter by match">
      {bandTabs.map(id => <button key={id} type="button" className={`match-band-tab band-${id}${band === id ? " is-active" : ""}`} aria-pressed={band === id} onClick={() => { setBand(id); setSort("match") }}>
        <span>{id === "all" ? "All applicants" : bandLabel[id]}</span><strong>{counts[id]}</strong>
      </button>)}
    </nav>
    <p className="match-explainer">Scores compare each CV and application with this job&apos;s {jobSkills.length ? "skills, " : ""}requirements and experience. Top match ≥ 70 · Good 50–69 · Fair 30–49 · Low under 30.{counts.unscored ? " “Not scored” means the CV couldn't be read (e.g. a scanned image) — open it to review." : ""}</p>

    <div className="employer-filter applicant-filters">
      <label className="field"><span className="field-label">Search</span><span className="input-with-icon"><Search size={15} aria-hidden="true" /><input className="input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, email, headline or skill" /></span></label>
      <label className="field"><span className="field-label">Stage</span><select className="input" value={stage} onChange={event => setStage(event.target.value)}><option value="">All stages</option>{employerStages.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span className="field-label">Sort</span><select className="input" value={sort} onChange={event => setSort(event.target.value as Sort)}><option value="match">Best match first</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
    </div>

    <div className="bulk-bar" role="region" aria-label="Bulk actions">
      <label className="bulk-select-all"><input type="checkbox" checked={allChosen} onChange={toggleAll} disabled={!visible.length} /> Select all {visible.length} shown</label>
      <span className="bulk-count">{chosen.length ? `${chosen.length} selected` : "Select applicants to move them together"}</span>
      <label className="sr-only" htmlFor="bulk-stage">Move selected to</label>
      <select id="bulk-stage" className="input" value={bulkStage} onChange={event => setBulkStage(event.target.value)} disabled={busy}>{employerStages.map(item => <option key={item}>{item}</option>)}</select>
      <button type="button" className="action-button action-primary" onClick={moveSelected} disabled={busy || !chosen.length}>{busy ? "Moving..." : `Move to ${bulkStage}`}</button>
      {message && <span className="form-message" role="status">{message}</span>}
    </div>

    {visible.length ? <section className="employer-panel employer-table-wrap"><table className="employer-table applicant-table"><thead><tr><th><span className="sr-only">Select</span></th><th>Candidate</th><th>Match</th><th>Applied</th><th>CV</th><th>Stage</th></tr></thead><tbody>{visible.map(item => <tr key={item.id} className={selected.has(item.id) ? "is-selected" : undefined}>
      <td data-label="Select"><input type="checkbox" aria-label={`Select ${item.candidateName}`} checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td>
      <td data-label="Candidate" className="cell-primary"><Link href={`/employer/applicants/${item.id}`}><strong>{item.candidateName}</strong></Link><small><a className="inline-link" href={`mailto:${item.candidateEmail}`}>{item.candidateEmail}</a>{item.candidatePhone ? ` · ${item.candidatePhone}` : ""}</small><small>{item.headline ?? "No headline"}{item.locationName ? ` · ${item.locationName}` : ""}</small>
        {item.coverLetter && <details className="cover-note"><summary>Cover note <ChevronDown size={13} aria-hidden="true" /></summary><p>{item.coverLetter}</p></details>}</td>
      <td data-label="Match"><div className="match-cell">
        <span className={`match-score band-${item.match.band}`}>{item.match.band === "unscored" ? "—" : `${item.match.score}%`}<small>{bandLabel[item.match.band]}</small></span>
        {item.match.matchedSkills.length > 0 && <ul className="skill-chips" aria-label="Matching skills">{item.match.matchedSkills.map(skill => <li key={skill} className="is-match">{skill}</li>)}</ul>}
        {item.match.band !== "unscored" && item.match.missingSkills.length > 0 && <ul className="skill-chips" aria-label="Missing skills">{item.match.missingSkills.map(skill => <li key={skill}>{skill}</li>)}</ul>}
        {item.match.requiredYears > 0 && <small className="match-years">{item.match.years === null ? "Experience not stated" : `${item.match.years}+ yrs`} · needs {item.match.requiredYears}</small>}
      </div></td>
      <td data-label="Applied">{day(item.appliedAt)}</td>
      <td data-label="CV">{item.resumeUrl ? <a className="inline-link" href={item.resumeUrl}><FileText size={15} aria-hidden="true" />{item.resumeFileName ?? "Download CV"}</a> : "Not attached"}</td>
      <td data-label="Stage"><div className="applicant-actions"><StageSelect key={`${item.id}-${item.stage}`} applicationId={item.id} initial={item.stage} /><MessageButton area="employer" applicationId={item.id} label="Message" />{savedIds && <SaveApplicantButton applicationId={item.id} initial={savedIds.includes(item.id)} compact />}<Link className="inline-link" href={`/employer/applicants/${item.id}`}>View <ArrowUpRight size={14} aria-hidden="true" /></Link></div></td>
    </tr>)}</tbody></table></section>
      : <section className="employer-panel employer-empty"><p>No applicants match these filters.</p></section>}
  </div>
}
