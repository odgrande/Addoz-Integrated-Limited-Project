/**
 * Applicant ↔ job match scoring.
 *
 * A transparent, deterministic score (0–100) built from three signals an
 * employer would check first:
 *   - Skills (50%): the job's listed skills found in the CV / application
 *   - Requirements (30%): key terms from the title, requirements and duties
 *   - Experience (20%): years of experience found vs. the years the job asks for
 * Jobs without listed skills weigh requirements 75% / experience 25%.
 * Applications with no readable text (e.g. a scanned-image PDF) are "unscored"
 * rather than ranked low, so nobody is filtered out unfairly.
 */

export type MatchBand = "top" | "good" | "fair" | "low" | "unscored"

export const matchBands: { id: Exclude<MatchBand, "unscored">; label: string; min: number }[] = [
  { id: "top", label: "Top match", min: 70 },
  { id: "good", label: "Good match", min: 50 },
  { id: "fair", label: "Fair match", min: 30 },
  { id: "low", label: "Low match", min: 0 },
]

export type MatchJob = {
  title: string
  skills?: string[] | null
  requirements?: string[] | null
  responsibilities?: string[] | null
  experience?: string | null
}

export type MatchApplicant = {
  cvText?: string | null
  coverLetter?: string | null
  headline?: string | null
  experience?: string | null
}

export type MatchResult = {
  score: number
  band: MatchBand
  matchedSkills: string[]
  missingSkills: string[]
  years: number | null
  requiredYears: number
  cvRead: boolean
}

const STOPWORDS = new Set(("a an and are as at be been being but by can could do does for from has have having he her his i if in into is it its may must not of on or our ours should so such than that the their them then there these they this those to up us was we were what when where which while who will with within without would you your yours " +
  "able ability across also any about after all strong excellent good great well work working job role roles team teams candidate candidates applicant required requirement requirements preferred plus including include includes etc new using use used make ensure ensuring other others own per via year years experience experienced knowledge understanding skills skill responsible responsibilities duties day daily least minimum relevant related similar field area areas level levels proven track record demonstrated").split(/\s+/))

const SYNONYMS: Record<string, string[]> = {
  "javascript": ["js"], "typescript": ["ts"], "microsoft excel": ["excel", "ms excel"], "microsoft word": ["ms word"],
  "microsoft office": ["ms office", "office 365"], "customer service": ["customer support", "customer care"],
  "human resources": ["hr"], "search engine optimization": ["seo"], "user experience": ["ux"], "user interface": ["ui"],
  "artificial intelligence": ["ai"], "machine learning": ["ml"], "bachelor": ["bsc", "b sc", "ba", "beng", "b eng", "b tech", "bachelors", "degree", "first degree"],
  "degree": ["bsc", "b sc", "hnd", "ond", "ba", "beng", "msc", "mba", "bachelor", "bachelors", "masters", "phd", "diploma"],
  "accounting": ["accountancy", "bookkeeping"], "driving": ["driver", "drivers licence", "driver s license", "drivers license"],
  "postgresql": ["postgres"], "kubernetes": ["k8s"], "communication": ["communication skills", "communicator"],
}

/** Lowercase, keep + and # (C++, C#), turn every other symbol into a word break. */
function normalize(text: string) {
  return ` ${text.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9+#]+/g, " ").replace(/\s+/g, " ").trim()} `
}

function words(text: string) {
  return normalize(text).trim().split(" ").filter(word => word.length > 2 && !STOPWORDS.has(word) && !/^\d+$/.test(word))
}

function has(hay: string, phrase: string) {
  const needle = normalize(phrase).trim()
  return Boolean(needle) && hay.includes(` ${needle} `)
}

/** 1 = found, 0.6 = every word of a multi-word skill appears somewhere, 0 = absent. */
function skillCredit(hay: string, skill: string) {
  const base = normalize(skill).trim()
  if (!base) return 0
  const variants = [base, ...(SYNONYMS[base] ?? []), ...Object.entries(SYNONYMS).filter(([, list]) => list.includes(base)).map(([key]) => key)]
  if (variants.some(variant => has(hay, variant))) return 1
  // "NodeJS" vs "Node.js", "React" vs "ReactJS"
  const compact = base.replace(/ /g, "")
  if (compact.length > 2 && (hay.includes(` ${compact} `) || hay.includes(` ${compact}js `))) return 1
  const parts = words(base)
  if (parts.length > 1 && parts.every(part => hay.includes(` ${part} `))) return 0.6
  return 0
}

/** Years the job asks for, from text like "3-5 years", "10+ years", "No experience". */
export function requiredYearsOf(experience: string | null | undefined) {
  if (!experience || /no experience|entry|fresh|graduate/i.test(experience)) return 0
  const number = experience.match(/\d+/)
  return number ? Math.min(Number(number[0]), 20) : 0
}

/** Years of experience claimed in a CV: explicit "N years" or the span of dated roles. */
export function yearsIn(text: string) {
  const now = new Date().getFullYear()
  const explicit = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/gi)].map(match => Number(match[1])).filter(value => value > 0 && value <= 45)
  const spans = [...text.matchAll(/\b((?:19|20)\d{2})\s*(?:-|–|—|to|until)\s*((?:19|20)\d{2}|present|current|date|now|today)\b/gi)]
    .map(match => ({ from: Number(match[1]), to: /\d/.test(match[2]!) ? Number(match[2]) : now }))
    .filter(span => span.from <= span.to && span.to <= now + 1)
  const spanYears = spans.length ? Math.max(...spans.map(span => span.to)) - Math.min(...spans.map(span => span.from)) : 0
  // A stated "N years" is more reliable than date ranges, which can include education
  const best = explicit.length ? Math.max(...explicit) : spanYears
  return best > 0 ? Math.min(best, 45) : null
}

export function bandOf(score: number, cvRead: boolean): MatchBand {
  if (!cvRead) return "unscored"
  return matchBands.find(band => score >= band.min)!.id
}

export function scoreApplicant(job: MatchJob, applicant: MatchApplicant): MatchResult {
  const text = [applicant.cvText, applicant.coverLetter, applicant.headline, applicant.experience].filter(Boolean).join("\n")
  const hay = normalize(text)
  const skills = [...new Set((job.skills ?? []).map(skill => skill.trim()).filter(Boolean))]
  const requiredYears = requiredYearsOf(job.experience)
  const cvRead = (applicant.cvText ?? "").trim().length >= 80 || hay.trim().length >= 200

  const credits = skills.map(skill => ({ skill, credit: skillCredit(hay, skill) }))
  const matchedSkills = credits.filter(item => item.credit >= 1).map(item => item.skill)
  const missingSkills = credits.filter(item => item.credit < 1).map(item => item.skill)
  const skillScore = skills.length ? credits.reduce((sum, item) => sum + item.credit, 0) / skills.length : 0

  const terms = [...new Set(words([job.title, ...(job.requirements ?? []), ...(job.responsibilities ?? [])].join(" ")))]
  const termHits = terms.filter(term => hay.includes(` ${term} `) || (SYNONYMS[term] ?? []).some(variant => has(hay, variant))).length
  // Few CVs repeat every word of a job ad; ~60% coverage already reads as a strong fit
  const termScore = terms.length ? Math.min(1, termHits / (terms.length * 0.6)) : skillScore

  const years = yearsIn(text) ?? (applicant.experience ? requiredYearsOf(applicant.experience) || null : null)
  const experienceScore = requiredYears === 0 ? 1 : years === null ? 0.4 : Math.min(1, years / requiredYears)

  const raw = skills.length ? skillScore * 0.5 + termScore * 0.3 + experienceScore * 0.2 : termScore * 0.75 + experienceScore * 0.25
  const score = cvRead ? Math.round(raw * 100) : 0
  return { score, band: bandOf(score, cvRead), matchedSkills, missingSkills, years, requiredYears, cvRead }
}
