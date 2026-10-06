import type { Metadata } from "next"
import { PageHeader, Reveal, SectionHeading } from "@/components/patterns"
import { BrandShape } from "@/components/brand/brand-shape"
import { featuredCategories } from "@/features/categories/data"
import { CategoryCard } from "@/features/categories/components/category-card"
import { CategoryIndex } from "@/features/categories/components/category-index"

// Live counts and companies: rebuilt at most once a minute
export const revalidate = 60

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse every job category on ADDOZ — six popular starting points, plus the complete A–Z list grouped by field.",
}

export default function CategoriesPage() {
  return <>
    <PageHeader
      eyebrow="CATEGORIES"
      title="Find your field"
      lead="Six popular starting points, and the complete ADDOZ category list below — grouped so you can scan it fast."
    />
    <section className="page-section dc-categories-hero">
      <BrandShape name="grid" colour="purple" className="dc-hero-shape" />
      <SectionHeading eyebrow="POPULAR" title="Where most candidates start" />
      <Reveal mode="scroll" className="category-grid">
        {featuredCategories.map((category, index) => <CategoryCard key={category.slug} category={category} variant="feature" index={index} />)}
      </Reveal>
    </section>
    <section className="page-section tone-cream-dark">
      <SectionHeading title="Every category, A–Z" lead="Grouped by field. Filter to jump straight to what you're after." />
      <CategoryIndex />
    </section>
  </>
}
