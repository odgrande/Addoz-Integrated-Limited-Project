/**
 * A company profile is complete when candidates can tell who is hiring:
 * name, industry, location, size and a real description. Jobs can only be
 * published / submitted for review, and only be approved, for complete companies.
 * Website, socials and logo are optional.
 */
export const MIN_DESCRIPTION_LENGTH = 50

type CompanyFields = { name?: string | null; industry?: string | null; locationId?: string | null; companySize?: string | null; description?: string | null } | null | undefined

/** Human labels of what's still missing (empty when complete). */
export function companyProfileMissing(company: CompanyFields) {
  if (!company) return ["company profile"]
  const missing: string[] = []
  if (!company.name?.trim()) missing.push("company name")
  if (!company.industry?.trim()) missing.push("industry")
  if (!company.locationId) missing.push("location")
  if (!company.companySize?.trim()) missing.push("company size")
  if ((company.description?.trim().length ?? 0) < MIN_DESCRIPTION_LENGTH) missing.push(`a description (at least ${MIN_DESCRIPTION_LENGTH} characters)`)
  return missing
}

export function isCompanyProfileComplete(company: CompanyFields) {
  return companyProfileMissing(company).length === 0
}

/** "industry, location and company size" */
export function listMissing(missing: string[]) {
  return missing.length <= 1 ? (missing[0] ?? "") : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`
}
