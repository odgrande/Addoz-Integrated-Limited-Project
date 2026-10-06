/** The public origin used for absolute URLs (sitemap, robots, emails). */
export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")
  if (process.env.URL) return process.env.URL.replace(/\/$/, "") // Netlify
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return "http://localhost:3000"
}
