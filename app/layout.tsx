import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'fotoapp — AI boligforbedring',
  description: 'Træk et boligfoto ind, vælg en stil, og få en AI-renoveret version som før/efter-kort.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  )
}
