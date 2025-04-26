'use client';

import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export function AuthButtons() {
  const { isAuthenticated, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <button
        onClick={logout}
        className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg 
          hover:bg-gray-100 transition-all duration-200 
          shadow-sm hover:shadow-md"
      >
        Đăng xuất
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg 
          hover:bg-gray-100 transition-all duration-200 
          shadow-sm hover:shadow-md"
      >
        Đăng nhập
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg 
          hover:bg-gray-100 transition-all duration-200 
          shadow-sm hover:shadow-md"
      >
        Đăng ký
      </Link>
    </div>
  );
} 