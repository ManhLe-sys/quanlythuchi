"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, setLanguage, translate } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to determine if a menu item should be shown based on user role
  const shouldShowMenuItem = (menuItem: string): boolean => {
    if (!user) return menuItem === 'products'; // Only show products if not logged in
    
    const role = user.role?.toLowerCase() || '';
    
    if (role === 'admin') return true; // Admins see everything
    
    if (role === 'staff') {
      // Staff sees everything except admin and reports
      return !['admin', 'reports'].includes(menuItem);
    }
    
    if (role === 'customer') {
      // Customers see home, products, and pomodoro
      return ['home', 'products', 'pomodoro'].includes(menuItem);
    }
    
    return true; // Default fallback
  };

  // Toggle language function
  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  // Handle clicks outside of dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              {translate('app_name')}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {shouldShowMenuItem('home') && (
              <Link 
                href="/home" 
                className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/home' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
              >
                {translate('thu_chi')}
              </Link>
            )}
            
            {shouldShowMenuItem('transactions') && (
              <Link 
                href="/transactions" 
                className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/transactions' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
              >
                {translate('giao_dich')}
              </Link>
            )}
            
            {shouldShowMenuItem('reports') && (
              <Link 
                href="/reports" 
                className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/reports' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
              >
                {translate('bao_cao')}
              </Link>
            )}
            
            {shouldShowMenuItem('products') && (
              <Link 
                href="/products" 
                className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/products' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
              >
                {translate('san_pham')}
              </Link>
            )}
            
            {shouldShowMenuItem('orders') && (
              <Link 
                href="/orders" 
                className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/orders' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
              >
                {translate('don_hang')}
              </Link>
            )}

            {shouldShowMenuItem('admin') && (
              <Link 
                href="/admin" 
                className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/admin' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
              >
                {translate('quan_ly')}
              </Link>
            )}

            {shouldShowMenuItem('pomodoro') && (
              <Link 
                href="/pomodoro" 
                className={`px-4 py-2 rounded-xl text-gray-700 font-medium transition-all ${
                  pathname === '/pomodoro' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                }`}
              >
                Pomodoro
              </Link>
            )}
          </nav>

          {/* User Menu or Login Button and Language Switcher */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-all flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
              </svg>
              <span className="font-medium">{language.toUpperCase()}</span>
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-[#3E503C] flex items-center justify-center text-white font-medium">
                    {user.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-gray-700 font-medium">{user.fullName}</span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{translate('vai_tro')}: {user.role || translate('nguoi_dung')}</p>
                    </div>
                    <Link 
                      href="/profile"
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{translate('thong_tin_tai_khoan')}</span>
                    </Link>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>{translate('dang_xuat')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>{translate('dang_nhap')}</span>
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
              {shouldShowMenuItem('home') && (
                <Link 
                  href="/home" 
                  className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                    pathname === '/home' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {translate('thu_chi')}
                </Link>
              )}
              
              {shouldShowMenuItem('transactions') && (
                <Link 
                  href="/transactions" 
                  className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                    pathname === '/transactions' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {translate('giao_dich')}
                </Link>
              )}
              
              {shouldShowMenuItem('reports') && (
                <Link 
                  href="/reports" 
                  className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                    pathname === '/reports' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {translate('bao_cao')}
                </Link>
              )}
              
              {shouldShowMenuItem('products') && (
                <Link 
                  href="/products" 
                  className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                    pathname === '/products' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {translate('san_pham')}
                </Link>
              )}
              
              {shouldShowMenuItem('orders') && (
                <Link 
                  href="/orders" 
                  className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                    pathname === '/orders' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {translate('don_hang')}
                </Link>
              )}
              
              {shouldShowMenuItem('admin') && (
                <Link 
                  href="/admin" 
                  className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                    pathname === '/admin' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {translate('quan_ly')}
                </Link>
              )}

              {shouldShowMenuItem('pomodoro') && (
                <Link 
                  href="/pomodoro" 
                  className={`px-4 py-3 rounded-xl text-gray-700 font-medium transition-all ${
                    pathname === '/pomodoro' ? 'bg-[#3E503C]/10 text-[#3E503C]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pomodoro
                </Link>
              )}

              {/* Mobile Language Switcher */}
              <button 
                onClick={toggleLanguage}
                className="mt-2 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <span className="font-medium">{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 