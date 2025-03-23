'use client';

import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export function AuthButtons() {
  const { isAuthenticated, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-gray-700"
      >
        Đăng xuất
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-gray-700"
      >
        Đăng nhập
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-gray-700"
      >
        Đăng ký
      </Link>
    </div>
  );
} 