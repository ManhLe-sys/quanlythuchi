import { ReactNode } from 'react';
import Link from 'next/link';

interface MenuLayoutProps {
  children: ReactNode;
}

export default function MenuLayout({ children }: MenuLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F3ECDB]">
      <nav className="bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-[#3E503C]">
                  Orbit Ken Menu
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/menu"
                  className="border-[#3E503C] text-[#3E503C] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Danh sách món
                </Link>
                <Link
                  href="/menu/categories"
                  className="border-transparent text-[#3E503C]/70 hover:border-[#3E503C]/30 hover:text-[#3E503C] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Danh mục
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
} 