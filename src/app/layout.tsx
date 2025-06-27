import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { AnimatedBackground } from './components/AnimatedBackground'
import RouteChangeLoading from "./components/RouteChangeLoading";
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/authOptions'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quản lý thu chi',
  description: 'Quản lý thu chi',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <RouteChangeLoading />
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AnimatedBackground />
        <div className="content-wrapper">
          <Providers session={session}>
            {children}
            <Toaster />
          </Providers>
        </div>
      </body>
    </html>
  )
}
