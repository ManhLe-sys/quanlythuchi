'use client';

import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Header from './components/Header'
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Session } from 'next-auth';

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <LanguageProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow pt-16 px-4 container mx-auto">
                {children}
              </main>
              <footer className="mt-auto border-t border-gray-200/10 backdrop-blur-xl">
                <div className="container mx-auto px-4 py-6">
                  <p className="text-center text-gray-400">
                    © 2024 Quản Lý Thu Chi. All rights reserved.
                  </p>
                </div>
              </footer>
            </div>
          </LanguageProvider>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
} 