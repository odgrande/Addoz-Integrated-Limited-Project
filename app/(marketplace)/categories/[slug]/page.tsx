import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { categories, getCategory } from "@/features/categories/data"
import { CategoryDetail } from "@/features/categories/components/category-detail"
import { searchMarketplace } from "@/features/jobs/public-data"

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return categories.map(category => ({ slug: category.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) return { title: "Category not found" }
  return { title: `${category.name} jobs`, description: category.description }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()
  const result = await searchMarketplace({ category: slug, page: 1 })
  return <CategoryDetail category={category} jobs={result.jobs} />
}
