import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="hse-theme">
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
