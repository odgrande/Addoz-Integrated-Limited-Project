import type { LucideIcon } from "lucide-react"
import { Bell, BookOpen, BriefcaseBusiness, Building2, ChartColumn, FileText, FolderKanban, Gauge, Heart, LayoutGrid, Mail, MapPin, MessageSquareQuote, PenSquare, Settings, Sparkles, UserRound, Users, UsersRound, BellRing, ClipboardList, Tags, ShieldCheck } from "lucide-react"

/**
 * Application navigation for the three workspaces. `tabs` are the items that sit
 * in the phone bottom bar (everything else is one tap away in the drawer).
 */
export type AppNavItem = { label: string; href: string; icon: LucideIcon; exact?: boolean }
export type AppNavSection = { title?: string; items: AppNavItem[] }
export type AppId = "candidate" | "employer" | "admin"

export type AppConfig = {
  id: AppId
  name: string
  home: string
  user: { name: string; role: string; initials: string }
  sections: AppNavSection[]
  tabs: string[]            // hrefs shown in the phone bottom bar
  shortcuts: AppNavItem[]   // links out to the public site
}

export const appConfigs: Record<AppId, AppConfig> = {
  candidate: {
    id: "candidate", name: "Candidate", home: "/candidate/dashboard",
    user: { name: "Guest Candidate", role: "Prototype candidate", initials: "GC" },
    sections: [
      { items: [
        { label: "Overview", href: "/candidate/dashboard", icon: Gauge, exact: true },
        { label: "Applications", href: "/candidate/applications", icon: ClipboardList },
        { label: "Saved jobs", href: "/candidate/saved-jobs", icon: Heart },
        { label: "Job alerts", href: "/candidate/job-alerts", icon: BellRing },
      ] },
      { title: "You", items: [
        { label: "Profile", href: "/candidate/profile", icon: UserRound },
        { label: "Resume", href: "/candidate/resume", icon: FileText },
        { label: "Notifications", href: "/candidate/notifications", icon: Bell },
        { label: "Settings", href: "/candidate/settings", icon: Settings },
      ] },
    ],
    tabs: ["/candidate/dashboard", "/candidate/applications", "/candidate/saved-jobs", "/candidate/job-alerts"],
    shortcuts: [
      { label: "Browse jobs", href: "/jobs", icon: BriefcaseBusiness },
      { label: "Career Intelligence", href: "/career-tools", icon: Sparkles },
    ],
  },
  employer: {
    id: "employer", name: "Employer", home: "/employer/dashboard",
    user: { name: "Hiring Manager", role: "Sample Tech Employer", initials: "HM" },
    sections: [
      { items: [
        { label: "Overview", href: "/employer/dashboard", icon: Gauge, exact: true },
        { label: "Jobs", href: "/employer/jobs", icon: BriefcaseBusiness },
        { label: "Post a job", href: "/employer/jobs/new", icon: PenSquare, exact: true },
        { label: "Applicants", href: "/employer/applicants", icon: UsersRound },
        { label: "Analytics", href: "/employer/analytics", icon: ChartColumn },
      ] },
      { title: "Company", items: [
        { label: "Company profile", href: "/employer/company", icon: Building2 },
        { label: "Your profile", href: "/employer/profile", icon: UserRound },
        { label: "Notifications", href: "/employer/notifications", icon: Bell },
        { label: "Settings", href: "/employer/settings", icon: Settings },
      ] },
    ],
    tabs: ["/employer/dashboard", "/employer/jobs", "/employer/applicants", "/employer/jobs/new"],
    shortcuts: [
      { label: "For employers", href: "/for-employers", icon: LayoutGrid },
    ],
  },
  admin: {
    id: "admin", name: "Admin", home: "/admin",
    user: { name: "ADDOZ Admin", role: "Prototype administrator", initials: "AA" },
    sections: [
      { items: [{ label: "Overview", href: "/admin", icon: Gauge, exact: true }] },
      { title: "Marketplace", items: [
        { label: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
        { label: "Applications", href: "/admin/applications", icon: ClipboardList },
        { label: "Companies", href: "/admin/companies", icon: Building2 },
        { label: "Categories", href: "/admin/categories", icon: Tags },
        { label: "Locations", href: "/admin/locations", icon: MapPin },
      ] },
      { title: "People", items: [
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Candidates", href: "/admin/candidates", icon: UserRound },
        { label: "Employers", href: "/admin/employers", icon: FolderKanban },
      ] },
      { title: "Content", items: [
        { label: "Blog", href: "/admin/blog", icon: BookOpen },
        { label: "AI tools", href: "/admin/ai-tools", icon: Sparkles },
        { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
        { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
      ] },
      { title: "System", items: [{ label: "Settings", href: "/admin/settings", icon: ShieldCheck }] },
    ],
    tabs: [],
    shortcuts: [],
  },
}

export function isActive(pathname: string, item: AppNavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}
