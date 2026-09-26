import type { Metadata } from "next"
import { PageHeader } from "@/components/patterns"
import { JobPostForm } from "@/features/employers/components/job-post-form"

export const metadata: Metadata = {
  title: "Post a job",
  description: "Post a job for free on ADDOZ — describe the role, set requirements and preview your listing before publishing.",
}

export default function PostAJobPage() {
  return <>
    <PageHeader
      variant="editorial"
      size="md"
      eyebrow="FOR EMPLOYERS"
      title="Post your job for free"
      lead="Fill in the details below — preview exactly how candidates will see your listing before you publish."
    />
    <section className="page-section">
      <JobPostForm context="public" />
    </section>
    <section className="page-section tight bordered">
      <aside className="fe-next" aria-label="What happens next">
        <p className="fe-next-title t-label">What happens next</p>
        <ol className="fe-next-list t-body">
          <li>Create a free employer account to publish your listing.</li>
          <li>Your job appears across ADDOZ search, category and location pages.</li>
          <li>Applications arrive in your employer dashboard for you to review, shortlist and hire.</li>
        </ol>
      </aside>
    </section>
  </>
}
