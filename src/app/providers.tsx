import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Header from './components/Header'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  )
} 