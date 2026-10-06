import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { PageTransition } from '@/components/addoz/page-transition'
import { ToastProvider } from '@/components/patterns/toast'
import './globals.css'
// Platform styles (Directive 007): shared patterns first, then each experience
import '@/styles/patterns.css'
import '@/styles/navigation.css'
import '@/styles/home.css'
import '@/styles/public.css'
import '@/styles/marketplace.css'
import '@/styles/discovery.css'
import '@/styles/intelligence.css'
import '@/styles/for-employers.css'
import '@/styles/marketing.css'
import '@/styles/auth.css'
import '@/styles/app.css'
import '@/styles/candidate.css'
import '@/styles/employer.css'
import '@/styles/admin.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'ADDOZ — Find your next move', template: '%s | ADDOZ' },
  description: 'Connecting African talent to what’s next. Explore jobs across Nigeria, discover career tools, and find your next great hire with ADDOZ Integrated Resources Limited.',
  // Icons come from app/favicon.ico, app/icon.png and app/apple-icon.png (ADDOZ mark)
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#FAF6EB',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light ${jakarta.variable}`}>
      <body className="antialiased">
        <PageTransition><ToastProvider>{children}</ToastProvider></PageTransition>
      </body>
    </html>
  )
}
