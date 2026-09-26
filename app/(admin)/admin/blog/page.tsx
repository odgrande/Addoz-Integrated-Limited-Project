import { BookOpen } from "lucide-react"

export default function AdminBlogPage() { return <main className="admin-page"><header className="app-page-header"><div><p className="app-eyebrow">Content</p><h1>Blog</h1><p className="app-page-lead">Editorial records are not yet stored in PostgreSQL.</p></div></header><section className="admin-panel admin-empty"><BookOpen size={34} aria-hidden="true" /><h2>No blog records to manage</h2><p>The public blog currently uses curated static content. Admin CRUD will be enabled when a blog table and publishing contract are introduced.</p></section></main> }
