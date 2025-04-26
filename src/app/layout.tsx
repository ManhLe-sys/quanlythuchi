import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Link from "next/link";
import { AuthButtons } from './components/AuthButtons';
import Header from './components/Header';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from './contexts/LanguageContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quản Lý Thu Chi | Finance Manager",
  description: "Ứng dụng quản lý thu chi cá nhân | Personal finance management app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <div className="min-h-screen bg-gradient-to-br from-[#F3ECDB] via-[#F3ECDB]/80 to-[#F3ECDB]">
              <Header />
              {/* Main Content */}
              <main className="pt-16">{children}</main>

              {/* Footer */}
              <footer className="glass-card mt-auto">
                <div className="container mx-auto px-4 py-6">
                  <p className="text-center text-[#3E503C]/70">
                    © 2024 Quản Lý Thu Chi. All rights reserved.
                  </p>
                </div>
              </footer>
            </div>
          </LanguageProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
