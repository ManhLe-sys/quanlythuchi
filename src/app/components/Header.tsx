"use client";

import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

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
          <div className="flex items-center">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-[#3E503C] hover:bg-[#7F886A] rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 