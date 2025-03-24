'use client';

import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export function AuthButtons() {
  const { isAuthenticated, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <button
        onClick={logout}
        className="px-4 py-2 bg-[#2C3639] text-white rounded-lg 
          hover:bg-[#3F4E4F] transition-all duration-200 
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
        className="px-4 py-2 bg-[#3E503C] text-white rounded-lg 
          hover:bg-[#7F886A] transition-all duration-200 
          shadow-sm hover:shadow-md"
      >
        Đăng nhập
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 bg-[#FF6F3D] text-white rounded-lg 
          hover:brightness-110 transition-all duration-200 
          shadow-sm hover:shadow-md"
      >
        Đăng ký
      </Link>
    </div>
  );
} 