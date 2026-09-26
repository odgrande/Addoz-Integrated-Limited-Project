import { Sparkles } from "lucide-react"

export default function AdminAiToolsPage() { return <main className="admin-page"><header className="app-page-header"><div><p className="app-eyebrow">Telemetry</p><h1>AI tools</h1><p className="app-page-lead">No provider usage records are stored yet, and no production AI provider is connected.</p></div></header><section className="admin-panel admin-empty"><Sparkles size={34} aria-hidden="true" /><h2>No AI usage records</h2><p>Provider, model, latency, and usage telemetry will appear here once an AI usage table exists.</p></section></main> }
