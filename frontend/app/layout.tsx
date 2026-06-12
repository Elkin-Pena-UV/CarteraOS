import type { Metadata } from 'next'
import { Providers } from './providers'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { SidebarStateProvider } from '@/lib/contexts/SidebarContext'
import './globals.css'

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: 'FinApp - Gestión de Cartera',
  description: 'Plataforma de gestión de cartera y tesorería integrada con ERP Siesa',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/csm-icon-png.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/csm-icon-png.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/csm-icon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <SidebarStateProvider>
                {children}
              </SidebarStateProvider>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
