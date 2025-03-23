"use client";

import { useAuth } from '../contexts/AuthContext';
import { AuthButtons } from './AuthButtons';
import Link from 'next/link';

export function Header() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold gradient-text">Quản Lý Thu Chi</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/transactions"
              className="text-[#3E503C] hover:text-[#7F886A] transition-colors"
            >
              Giao Dịch
            </Link>
            <Link
              href="/orders"
              className="text-[#3E503C] hover:text-[#7F886A] transition-colors"
            >
              Đơn Hàng
            </Link>
            <Link
              href="/reports"
              className="text-[#3E503C] hover:text-[#7F886A] transition-colors"
            >
              Báo Cáo
            </Link>
          </div>

          {/* User Info & Auth Buttons */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <div className="flex items-center mr-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-[#3E503C]">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-[#3E503C]/70">
                    {user.email}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#3E503C] text-white flex items-center justify-center ml-3">
                  {user.fullName?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            )}
            <AuthButtons />
          </div>
        </div>
      </div>
    </header>
  );
} 