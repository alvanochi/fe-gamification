import type { Metadata } from 'next'
import { Geist, Geist_Mono, Archivo_Black } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/ThemeProvider'
import QueryProvider from '@/providers/QueryProvider'
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const archivoBlack = Archivo_Black({
  variable: '--font-archivo-black',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Millionaire Race — Yogyakarta',
  description:
    'Platform gamifikasi Millionaire Race: kejar 30 misi, jelajahi Yogyakarta bareng timmu, dan naik ke puncak leaderboard.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} antialiased bg-paper text-ink`}
      >
        <QueryProvider>
          <ThemeProvider>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
