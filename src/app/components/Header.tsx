"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/products" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#3E503C] to-[#7F886A] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-bold text-lg text-gray-700">
              Quản Lý Thu Chi
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/home" 
              className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                pathname === '/home' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
              }`}
            >
              Trang Chủ
            </Link>
            
            <Link 
              href="/transactions" 
              className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                pathname === '/transactions' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
              }`}
            >
              Giao Dịch
            </Link>
            
            <Link 
              href="/reports" 
              className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                pathname === '/reports' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
              }`}
            >
              Báo Cáo
            </Link>
            
            <Link 
              href="/products" 
              className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                pathname === '/products' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
              }`}
            >
              Sản Phẩm
            </Link>
            
            <Link 
              href="/orders" 
              className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                pathname === '/orders' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
              }`}
            >
              Đơn Hàng
            </Link>
            
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/admin' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
              >
                Quản Trị
              </Link>
            )}
          </nav>

          {/* User Menu or Login Button */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all">
                  <div className="h-8 w-8 rounded-full bg-[#3E503C] flex items-center justify-center text-white font-medium">
                    {user.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-gray-700 font-medium">{user.fullName}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 hidden group-hover:block">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">{user.email}</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 bg-[#3E503C] text-white rounded-xl hover:bg-[#7F886A] transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Đăng Nhập</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <nav className="flex flex-col gap-2">
              <Link 
                href="/home" 
                className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/home' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Trang Chủ
              </Link>
              
              <Link 
                href="/transactions" 
                className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/transactions' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Giao Dịch
              </Link>
              
              <Link 
                href="/reports" 
                className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/reports' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Báo Cáo
              </Link>
              
              <Link 
                href="/products" 
                className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/products' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sản Phẩm
              </Link>
              
              <Link 
                href="/orders" 
                className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/orders' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Đơn Hàng
              </Link>
              
              {user?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                    pathname === '/admin' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Quản Trị
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 