/**
 * Company profiles — SAMPLE DATA.
 *
 * The current ADDOZ site has no public company directory (its /job-companies/ page
 * only shows theme demo industries), and the directive forbids inventing company
 * information. These are clearly labelled placeholder employers: every name says
 * "Sample", and every profile says it is a preview. Industries and locations use
 * real ADDOZ categories and areas. Production replaces this file with verified
 * employer profiles created by employers themselves.
 */

export type Company = {
  slug: string
  name: string
  industry: string        // category name (features/categories)
  location: string        // area slug (features/locations)
  locationName?: string
  mark: string
  tone: "purple" | "yellow" | "orange" | "black"
  size: string
  overview: string
  website?: string
  /** Live roles (database directory); static sample profiles count from sample jobs. */
  openRoles?: number
  sample: boolean
}

const overview = (field: string) =>
  `A sample ${field} employer profile. It previews how a verified company page will look on ADDOZ — identity, overview and open roles in one place. Real companies will write their own profile once employer accounts go live.`

export const companies: Company[] = [
  { slug: "sample-tech-employer", name: "Sample Tech Employer", industry: "Development & IT", location: "ikeja", mark: "ST", tone: "purple", size: "Size shared by employer", overview: overview("technology"), sample: true },
  { slug: "sample-finance-employer", name: "Sample Finance Employer", industry: "Accounting & Finance", location: "victoria-island", mark: "SF", tone: "yellow", size: "Size shared by employer", overview: overview("finance"), sample: true },
  { slug: "sample-manufacturing-employer", name: "Sample Manufacturing Employer", industry: "Manufacturing/Industrial", location: "mowe", mark: "SM", tone: "orange", size: "Size shared by employer", overview: overview("manufacturing"), sample: true },
  { slug: "sample-retail-employer", name: "Sample Retail Employer", industry: "Retail & Sales", location: "lekki", mark: "SR", tone: "black", size: "Size shared by employer", overview: overview("retail"), sample: true },
  { slug: "sample-logistics-employer", name: "Sample Logistics Employer", industry: "Logistics & Transportation", location: "oshodi-isolo", mark: "SL", tone: "yellow", size: "Size shared by employer", overview: overview("logistics"), sample: true },
  { slug: "sample-healthcare-employer", name: "Sample Healthcare Employer", industry: "Healthcare & Medical", location: "agege", mark: "SH", tone: "purple", size: "Size shared by employer", overview: overview("healthcare"), sample: true },
  { slug: "sample-creative-studio", name: "Sample Creative Studio", industry: "Design & Creative", location: "victoria-island", mark: "SC", tone: "orange", size: "Size shared by employer", overview: overview("creative"), sample: true },
  { slug: "sample-services-employer", name: "Sample Services Employer", industry: "Customer Service", location: "ikorodu", mark: "SS", tone: "black", size: "Size shared by employer", overview: overview("customer service"), sample: true },
]

export function getCompany(slug: string) {
  return companies.find(company => company.slug === slug)
}

export const companyIndustries = [...new Set(companies.map(company => company.industry))].sort()
