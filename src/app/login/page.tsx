"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Toast } from "../components/Toast";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi đăng nhập');
      }

      setSuccess('Đăng nhập thành công!');
      
      if (data.user) {
        login({
          fullName: data.user.fullName,
          email: data.user.email
        });
      }
      
      router.push("/");
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-background">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F3ECDB] via-[#F3ECDB]/80 to-[#F3ECDB]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/subtle-pattern.png')] opacity-5"></div>
      </div>

      <div className="w-full max-w-md">
        <div className="glass-card p-8 rounded-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-3">Đăng Nhập</h1>
            <p className="text-[#3E503C]/70">Chào mừng bạn quay trở lại!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded text-gray-700"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 btn-primary"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 