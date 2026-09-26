import { slugify } from "@/lib/format"

/**
 * Job categories — the full list exposed on addozconsultinglimited.com (checked
 * 23 Sep 2026). Exact duplicates on the live site ("Accounting／Finance",
 * "Manufacturing", "Industrial|Manufacturing/Industrial", "Logistics and
 * Haulage|Sales & Marketing") are merged into their main entry. The six featured
 * categories keep the ADDOZ homepage copy. Groups are an information-architecture
 * layer for browsing; they make no claim about the jobs inside them.
 */

export type CategoryGroup = { slug: string; name: string; line: string }

export const categoryGroups: CategoryGroup[] = [
  { slug: "technology-data", name: "Technology & data", line: "Build, secure and make sense of what's next." },
  { slug: "business-finance", name: "Business & finance", line: "Keep organisations running and growing." },
  { slug: "sales-marketing-media", name: "Sales, marketing & media", line: "Connect people with what they need." },
  { slug: "creative-content", name: "Creative & content", line: "Make work that people feel." },
  { slug: "people-service", name: "People & service", line: "Be the difference for someone every day." },
  { slug: "industry-trades", name: "Industry & trades", line: "Make, move and maintain the real world." },
  { slug: "health-science", name: "Health & science", line: "Care, research and discovery." },
  { slug: "hospitality-travel", name: "Hospitality & travel", line: "Welcome people well." },
  { slug: "public-impact", name: "Public & social impact", line: "Work that serves communities." },
  { slug: "flexible-early-career", name: "Flexible & early career", line: "Start, switch or shape how you work." },
]

type Seed = [name: string, group: string, featured?: { line: string; description: string; icon: string; slug?: string }]

// Featured copy is the ADDOZ homepage copy (Explore section); slugs match the live site's category URLs.
const seeds: Seed[] = [
  ["Development & IT", "technology-data", { slug: "development-it", icon: "code", line: "Build what’s next.", description: "From your first line of code to your next big product. Find your place in tech." }],
  ["Design & Creative", "creative-content", { slug: "design-creative", icon: "pen", line: "Make your mark.", description: "Turn your ideas into work that people feel. Explore roles for creative minds." }],
  ["Marketing & Sales", "sales-marketing-media", { slug: "marketing-sales", icon: "megaphone", line: "Move people forward.", description: "Connect brands with people. Discover opportunities to grow an audience and make an impact." }],
  ["Customer Service", "people-service", { slug: "customer-service", icon: "messages", line: "Be the difference.", description: "Bring your people skills to a role that makes someone’s day a little better." }],
  ["Product Management", "technology-data", { slug: "product-management", icon: "blocks", line: "See the bigger picture.", description: "Connect teams, ideas and customer needs. Help shape products worth building." }],
  ["Writing & Translation", "creative-content", { slug: "writing-translation", icon: "pencil", line: "Find the right words.", description: "Make complicated ideas clear. Discover opportunities to write, edit and connect." }],
  ["Accounting & Finance", "business-finance"],
  ["Administration & Office Support", "people-service"],
  ["Agriculture & Farming", "industry-trades"],
  ["Analytics", "technology-data"],
  ["Architecture & Construction", "industry-trades"],
  ["Banking & Financial Services", "business-finance"],
  ["Beauty & Wellness", "people-service"],
  ["Business Development", "business-finance"],
  ["Call Centre & Customer Service", "people-service"],
  ["Catering & Hospitality", "hospitality-travel"],
  ["Cleaning & Maintenance", "industry-trades"],
  ["Consulting", "business-finance"],
  ["Creative & Design", "creative-content"],
  ["Customer Success", "people-service"],
  ["Cybersecurity", "technology-data"],
  ["Data & Analytics", "technology-data"],
  ["Digital Marketing", "sales-marketing-media"],
  ["E-commerce", "sales-marketing-media"],
  ["Education & Teaching", "people-service"],
  ["Engineering", "industry-trades"],
  ["Environmental Services", "industry-trades"],
  ["Events Management", "creative-content"],
  ["Executive & Management", "business-finance"],
  ["Fashion & Textile", "creative-content"],
  ["Government & Public Sector", "public-impact"],
  ["Healthcare & Medical", "health-science"],
  ["Human Resources", "people-service"],
  ["Humanitarian & Development Work", "public-impact"],
  ["Information Technology", "technology-data"],
  ["Insurance", "business-finance"],
  ["Internships & Graduate Jobs", "flexible-early-career"],
  ["Legal & Finance", "business-finance"],
  ["Legal Services", "business-finance"],
  ["Logistics & Transportation", "industry-trades"],
  ["Logistics and Haulage", "industry-trades"],
  ["Manufacturing/Industrial", "industry-trades"],
  ["Marketing & Advertising", "sales-marketing-media"],
  ["Media & Communications", "sales-marketing-media"],
  ["NGOs & Non-Profit", "public-impact"],
  ["Oil & Gas", "industry-trades"],
  ["Operations", "business-finance"],
  ["Part-Time Jobs", "flexible-early-career"],
  ["Pharmaceuticals", "health-science"],
  ["Procurement & Supply Chain", "business-finance"],
  ["Project Management", "technology-data"],
  ["Public Relations", "sales-marketing-media"],
  ["Quality Assurance", "technology-data"],
  ["Real Estate & Property", "business-finance"],
  ["Remote & Freelance", "flexible-early-career"],
  ["Research & Science", "health-science"],
  ["Restaurant & Food Services", "hospitality-travel"],
  ["Retail & Sales", "sales-marketing-media"],
  ["Sales", "sales-marketing-media"],
  ["Sales & Marketing", "sales-marketing-media"],
  ["Security & Safety", "industry-trades"],
  ["Skilled Trades", "industry-trades"],
  ["Software Development", "technology-data"],
  ["Technical Support", "technology-data"],
  ["Telecommunications", "technology-data"],
  ["Travel & Tourism", "hospitality-travel"],
  ["Writing & Content", "creative-content"],
]

export type Category = {
  slug: string
  name: string
  group: string
  featured: boolean
  icon?: string
  line: string
  description: string
}

export const categories: Category[] = seeds.map(([name, group, featured]) => ({
  slug: featured?.slug ?? slugify(name),
  name,
  group,
  featured: !!featured,
  icon: featured?.icon,
  line: featured?.line ?? `Opportunities in ${name.toLowerCase()}.`,
  description: featured?.description ?? `Browse ${name} roles on ADDOZ and filter by location, job type and experience.`,
}))

export const featuredCategories = categories.filter(category => category.featured)

export function getCategory(slug: string) {
  return categories.find(category => category.slug === slug)
}

export function getCategoryByName(name: string) {
  return categories.find(category => category.name === name)
}

export function categoriesInGroup(group: string) {
  return categories.filter(category => category.group === group).sort((a, b) => a.name.localeCompare(b.name))
}

export function relatedCategories(slug: string, limit = 4) {
  const category = getCategory(slug)
  if (!category) return []
  return categories.filter(other => other.group === category.group && other.slug !== slug).slice(0, limit)
}
