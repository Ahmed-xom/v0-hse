import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AuthProvider } from '@/lib/auth-context'
import { LanguageProvider } from '@/lib/language-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AmnkoIntro } from '@/components/amnko-intro'
import { isPreviewDemoMode } from '@/lib/preview-demo'
import { connection } from 'next/server'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.amnkoo.online'),
  title: 'AMNKO | HSE Management System',
  description: 'AMNKO is a smart Health, Safety and Environment management system designed to help companies manage safety, risks, inspections, incidents and compliance efficiently.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://www.amnkoo.online/',
    siteName: 'AMNKO HSE',
    title: 'AMNKO | HSE Management System',
    description: 'AMNKO is a smart Health, Safety and Environment management system designed to help companies manage safety, risks, inspections, incidents and compliance efficiently.',
    images: [{ url: '/amnko-hse-logo.png', width: 1200, height: 1200, alt: 'AMNKO HSE logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AMNKO | HSE Management System',
    description: 'Smart Health, Safety and Environment management for safer, more compliant companies.',
    images: ['/amnko-hse-logo.png'],
  },
  icons: {
    icon: '/amnko-hse-logo.png',
    apple: '/amnko-hse-logo.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const demo = isPreviewDemoMode()
  // Do not prerender live pages without their providers during a preview build.
  if (demo) await connection()
  return (
    <html lang="ar" dir="rtl" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme={demo ? "light" : undefined} enableSystem={false} storageKey="hse-theme">
          {demo ? children : (
            <AuthProvider>
              <LanguageProvider>
                {children}
              </LanguageProvider>
              <Toaster />
              <AmnkoIntro />
            </AuthProvider>
          )}
          {!demo && process.env.NODE_ENV === 'production' && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
