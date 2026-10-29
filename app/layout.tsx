import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AuthProvider } from '@/lib/auth-context'
import { getInitialAuthUser } from '@/lib/auth/server-profile'
import { LanguageProvider } from '@/lib/language-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = localFont({
  src: './fonts/Geist-latin-variable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
});
const _geistMono = localFont({
  src: './fonts/GeistMono-latin-variable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
});

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
  const initialUser = await getInitialAuthUser()
  return (
    <html lang="ar" dir="rtl" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="hse-theme">
          <AuthProvider initialUser={initialUser}>
            <LanguageProvider>
              {children}
            </LanguageProvider>
            <Toaster />
          </AuthProvider>
          {process.env.NODE_ENV === 'production' && (
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
