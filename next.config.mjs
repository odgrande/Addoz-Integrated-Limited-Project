/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ] }]
  },
  images: {
    unoptimized: true,
  },
  // QA only (never set in production): run against a throwaway local PGlite database
  ...(process.env.PGLITE_DIR ? {
    serverExternalPackages: ['@electric-sql/pglite'],
    turbopack: { resolveAlias: { '@/lib/db/schema': './lib/db/schema.ts', '@/lib/db': './scripts/qa/pglite-db.ts' } },
  } : {}),
}

export default nextConfig
