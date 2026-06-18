import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Malaysia Place Finder',
  description: 'Find the best places in Malaysia using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
