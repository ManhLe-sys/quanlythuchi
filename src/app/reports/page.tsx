"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("month");

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold gradient-text">Báo Cáo & Thống Kê</h1>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="glass-card p-6 rounded-3xl mb-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setTimeRange("day")}
              className={`px-6 py-2 rounded-full transition-colors ${
                timeRange === "day"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setTimeRange("week")}
              className={`px-6 py-2 rounded-full transition-colors ${
                timeRange === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-6 py-2 rounded-full transition-colors ${
                timeRange === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-6 py-2 rounded-full transition-colors ${
                timeRange === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Năm
            </button>
          </div>
          <div className="flex gap-4">
            <input
              type="date"
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Tổng Thu</h3>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">15,000,000đ</p>
          <div className="flex items-center text-sm text-green-500 mt-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>+10% so với tháng trước</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Tổng Chi</h3>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">5,000,000đ</p>
          <div className="flex items-center text-sm text-red-500 mt-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6 6" />
            </svg>
            <span>+5% so với tháng trước</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Lợi Nhuận</h3>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">10,000,000đ</p>
          <div className="flex items-center text-sm text-blue-500 mt-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>+15% so với tháng trước</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Tổng Đơn Hàng</h3>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">25</p>
          <div className="flex items-center text-sm text-purple-500 mt-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>+8% so với tháng trước</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Thu Chi Theo Thời Gian</h3>
          <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Biểu đồ sẽ được thêm vào đây</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Chi Tiêu Theo Danh Mục</h3>
          <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Biểu đồ sẽ được thêm vào đây</p>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Báo Cáo Chi Tiết</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Danh mục</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Thu nhập</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Chi tiêu</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Lợi nhuận</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Kinh doanh</td>
                <td className="px-6 py-4 text-sm text-right text-green-600">10,000,000đ</td>
                <td className="px-6 py-4 text-sm text-right text-red-600">3,000,000đ</td>
                <td className="px-6 py-4 text-sm text-right text-blue-600">7,000,000đ</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">70%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Lương</td>
                <td className="px-6 py-4 text-sm text-right text-green-600">5,000,000đ</td>
                <td className="px-6 py-4 text-sm text-right text-red-600">0đ</td>
                <td className="px-6 py-4 text-sm text-right text-blue-600">5,000,000đ</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">30%</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Tổng cộng</td>
                <td className="px-6 py-4 text-sm font-medium text-right text-green-600">15,000,000đ</td>
                <td className="px-6 py-4 text-sm font-medium text-right text-red-600">3,000,000đ</td>
                <td className="px-6 py-4 text-sm font-medium text-right text-blue-600">12,000,000đ</td>
                <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 