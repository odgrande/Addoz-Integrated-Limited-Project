/**
 * Public navigation architecture (Directive 007 §19). Four primary groups keep the
 * header light; everything else sits one level down. The same config drives the
 * desktop panels, the tablet/phone drawer and the footer.
 */
export type NavItem = { label: string; href: string; description?: string }
export type NavGroup = { id: string; label: string; href: string; badge?: string; intro: string; cta: NavItem; items: NavItem[] }

export const primaryNav: NavGroup[] = [
  {
    id: "jobs", label: "Jobs", href: "/jobs",
    intro: "Find the right role faster — search, filter and apply across Nigeria.",
    cta: { label: "Browse all jobs", href: "/jobs" },
    items: [
      { label: "Browse jobs", href: "/jobs", description: "Search and filter every open role." },
      { label: "Companies", href: "/companies", description: "See who is hiring on ADDOZ." },
      { label: "Categories", href: "/categories", description: "Find roles by the work you do." },
      { label: "Locations", href: "/locations", description: "Opportunities closer to home." },
    ],
  },
  {
    id: "intelligence", label: "Career Intelligence", href: "/career-tools", badge: "AI",
    intro: "AI-powered support for the moments that move your career forward.",
    cta: { label: "Explore Career Intelligence", href: "/career-tools" },
    items: [
      { label: "Resume Scanner", href: "/career-tools/resume-scanner", description: "Get your CV past the first look." },
      { label: "Interview Prep", href: "/career-tools/interview-prep", description: "Walk in a little more ready." },
      { label: "Cover Letter", href: "/career-tools/cover-letter", description: "Your story. Well told." },
      { label: "Career resources", href: "/blog", description: "Insights, articles and news." },
    ],
  },
  {
    id: "employers", label: "For Employers", href: "/for-employers",
    intro: "Looking to post a job? Find professionals across all skills.",
    cta: { label: "Post your job for FREE", href: "/for-employers/post-a-job" },
    items: [
      { label: "Hire with ADDOZ", href: "/for-employers", description: "How posting and hiring work." },
      { label: "Post a job", href: "/for-employers/post-a-job", description: "Your listing, live in minutes." },
      { label: "Employer sign in", href: "/auth/login?role=employer", description: "Manage your listings and applicants." },
    ],
  },
  {
    id: "about", label: "About", href: "/about",
    intro: "We are transforming the way Nigeria finds and hires talent.",
    cta: { label: "Contact ADDOZ", href: "/contact" },
    items: [
      { label: "About ADDOZ", href: "/about", description: "Who we are and why we do this." },
      { label: "Contact", href: "/contact", description: "Talk to the ADDOZ team." },
      { label: "FAQ", href: "/faq", description: "Answers to common questions." },
    ],
  },
]

export const footerNav: { title: string; items: NavItem[] }[] = [
  { title: "Your next move", items: [{ label: "Find a job", href: "/jobs" }, { label: "Companies", href: "/companies" }, { label: "Categories", href: "/categories" }, { label: "Locations", href: "/locations" }, { label: "Career Intelligence", href: "/career-tools" }] },
  { title: "Your next hire", items: [{ label: "For employers", href: "/for-employers" }, { label: "Post a job", href: "/for-employers/post-a-job" }, { label: "Employer sign in", href: "/auth/login?role=employer" }] },
  { title: "Company", items: [{ label: "About", href: "/about" }, { label: "Career resources", href: "/blog" }, { label: "Contact", href: "/contact" }, { label: "FAQ", href: "/faq" }, { label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
]

export const accountNav = { login: { label: "Log in", href: "/auth/login" }, register: { label: "Get started", href: "/auth/register" } }
