import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { AnimatedBackground } from './components/AnimatedBackground'
import RouteChangeLoading from "./components/RouteChangeLoading";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Orbit Ken',
  description: 'Orbit Ken - Modern Finance Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <RouteChangeLoading />
        <AnimatedBackground />
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
