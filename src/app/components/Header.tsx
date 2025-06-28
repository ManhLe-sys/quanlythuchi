"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DropdownMenu } from './ui/dropdown-menu';

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
      // Customers see home, products, pomodoro, and schedule
      return ['home', 'products', 'pomodoro', 'schedule'].includes(menuItem);
    }
    
    return true; // Default fallback
  };

  // Menu items grouped by category
  const financeMenuItems = [
    { href: '/home', label: translate('thu_chi'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { href: '/transactions', label: translate('giao_dich'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { href: '/reports', label: translate('bao_cao'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  ].filter(item => shouldShowMenuItem(item.href.replace('/', '')));

  const salesMenuItems = [
    { href: '/products', label: translate('san_pham'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
    { href: '/orders', label: translate('don_hang'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { href: '/admin', label: translate('quan_ly'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
  ].filter(item => shouldShowMenuItem(item.href.replace('/', '')));

  const featureMenuItems = [
    { href: '/pomodoro', label: 'Pomodoro', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { href: '/schedule', label: translate('lich_lam_viec'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  ].filter(item => shouldShowMenuItem(item.href.replace('/', '')));

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-700/20 bg-slate-900/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/products" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-md">
              <img
                src="/orbit-ken-high-resolution-logo-transparent.png"
                alt="Orbit Ken Logo"
                className="h-8 w-8 object-contain"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.15))' }}
              />
            </div>
            <div className="font-bold text-lg text-slate-100">
              {translate('app_name')}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {financeMenuItems.length > 0 && (
              <DropdownMenu
                trigger={
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {translate('thu_chi')}
                  </span>
                }
                items={financeMenuItems}
                label={translate('thu_chi')}
              />
            )}

            {salesMenuItems.length > 0 && (
              <DropdownMenu
                trigger={
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {translate('quan_ly_ban_hang')}
                  </span>
                }
                items={salesMenuItems}
                label={translate('quan_ly_ban_hang')}
              />
            )}

            {featureMenuItems.length > 0 && (
              <DropdownMenu
                trigger={
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    {translate('chuc_nang')}
                  </span>
                }
                items={featureMenuItems}
                label={translate('chuc_nang')}
              />
            )}
          </nav>

          {/* User Menu or Login Button and Language Switcher */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-all flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
              </svg>
              <span className="font-medium">{language.toUpperCase()}</span>
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-800/50 transition-all"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-medium">
                    {user.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-slate-300 font-medium">{user.fullName}</span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 rounded-xl shadow-lg border border-slate-700/20 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-700/20">
                      <p className="text-sm font-medium text-slate-300">{user.email}</p>
                      <p className="text-xs text-slate-400 mt-1">{translate('vai_tro')}: {user.role || translate('nguoi_dung')}</p>
                    </div>
                    <Link 
                      href="/profile"
                      className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800/50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{translate('thong_tin_tai_khoan')}</span>
                    </Link>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800/50 transition-colors flex items-center gap-2"
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
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium hover:opacity-90 transition-all"
              >
                {translate('dang_nhap')}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-800/50"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-slate-700/20">
            {/* Finance Menu */}
            {financeMenuItems.length > 0 && (
              <div className="mt-2">
                <div className="px-4 py-2 text-sm font-medium text-slate-400">{translate('thu_chi')}</div>
                {financeMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 text-slate-300 ${
                      pathname === item.href ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Sales Menu */}
            {salesMenuItems.length > 0 && (
              <div className="mt-2">
                <div className="px-4 py-2 text-sm font-medium text-slate-400">{translate('quan_ly_ban_hang')}</div>
                {salesMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 text-slate-300 ${
                      pathname === item.href ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Features Menu */}
            {featureMenuItems.length > 0 && (
              <div className="mt-2">
                <div className="px-4 py-2 text-sm font-medium text-slate-400">{translate('chuc_nang')}</div>
                {featureMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 text-slate-300 ${
                      pathname === item.href ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
} 