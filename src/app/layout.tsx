import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Quản lý thu chi',
  description: 'Quản lý thu chi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="animated-background">
          <div className="nebula" />
          <div className="dots-grid" />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="glow-line" />
          <div className="glow-line" />
          <div className="glow-line" />
          <div className="glow-line" />
          <div className="particle-container">
            <div className="particle" />
            <div className="particle" />
            <div className="particle" />
            <div className="particle" />
            <div className="particle" />
          </div>
        </div>
        <div className="content-wrapper">
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </div>
      </body>
    </html>
  )
}
