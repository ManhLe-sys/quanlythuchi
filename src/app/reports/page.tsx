"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import DateRangePicker from "../components/DateRangePicker";

interface Transaction {
  id: string;
  date: string;
  type: 'Thu' | 'Chi';
  category: string;
  description: string;
  amount: number;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactions: Transaction[];
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("month");
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!user?.fullName) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/transactions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tải dữ liệu');
      }

      // Filter transactions by user
      let filteredTransactions = data.transactions.filter(
        (t: Transaction) => t.recordedBy === user.fullName
      );

      // Filter by date range
      if (dateRange.startDate && dateRange.endDate) {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);

        filteredTransactions = filteredTransactions.filter((t: Transaction) => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }

      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;

      // Log initial state
      console.log('Starting calculations with filtered transactions:', 
        filteredTransactions.length);

      filteredTransactions.forEach((t: Transaction) => {
        const amount = Number(t.amount);
        if (isNaN(amount)) {
          console.warn('Invalid amount found:', t);
          return;
        }

        if (t.type === 'Thu') {
          totalIncome += amount;
          console.log('Added to income:', amount, 'New total:', totalIncome);
        } else if (t.type === 'Chi') {
          totalExpense += amount;
          console.log('Added to expense:', amount, 'New total:', totalExpense);
        }
      });

      // Debug logs
      console.log('Final calculation details:', {
        user: user.fullName,
        dateRange,
        transactionsCount: filteredTransactions.length,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        sampleTransactions: filteredTransactions.slice(0, 3).map(t => ({
          type: t.type,
          amount: t.amount,
          date: t.date
        }))
      });

      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactions: filteredTransactions
      });

      setError(null);
    } catch (err) {
      console.error('Error in fetchTransactions:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  // Update date range based on time range selection
  useEffect(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (timeRange) {
      case "day":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        // Get first day of week (Monday)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff);
        end = new Date(now.getFullYear(), now.getMonth(), diff + 6);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  }, [timeRange]);

  // Fetch data when user changes or date range changes
  useEffect(() => {
    if (user?.fullName && dateRange.startDate && dateRange.endDate) {
      fetchTransactions();
    }
  }, [user?.fullName, dateRange.startDate, dateRange.endDate]);

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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex gap-4">
            <button
              onClick={() => setTimeRange("day")}
              className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${
                timeRange === "day"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setTimeRange("week")}
              className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${
                timeRange === "week"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${
                timeRange === "month"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${
                timeRange === "year"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Năm
            </button>
          </div>
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onStartDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
            onEndDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
            className="w-full md:w-auto"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Tổng Thu</h3>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-green-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(summary.totalIncome)}
            </p>
          )}
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
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-red-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(summary.totalExpense)}
            </p>
          )}
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Số Dư</h3>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(summary.balance)}
            </p>
          )}
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
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Số dư</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-600">{error}</td>
                </tr>
              ) : summary.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu trong khoảng thời gian này
                  </td>
                </tr>
              ) : (
                <>
                  {/* Group and calculate by category */}
                  {Object.entries(
                    summary.transactions.reduce((acc, t) => {
                      const category = t.category;
                      if (!acc[category]) {
                        acc[category] = { income: 0, expense: 0 };
                      }
                      if (t.type === 'Thu') {
                        acc[category].income += t.amount;
                      } else {
                        acc[category].expense += t.amount;
                      }
                      return acc;
                    }, {} as Record<string, { income: number; expense: number }>)
                  ).map(([category, data]) => {
                    const balance = data.income - data.expense;
                    const percentage = Math.round((balance / summary.balance) * 100);
                    
                    return (
                      <tr key={category} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{category}</td>
                        <td className="px-6 py-4 text-sm text-right text-green-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(data.income)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-red-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(data.expense)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-blue-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(balance)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-6 py-4 text-sm text-gray-900">Tổng cộng</td>
                    <td className="px-6 py-4 text-sm text-right text-green-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(summary.totalIncome)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-red-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(summary.totalExpense)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-blue-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(summary.balance)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">100%</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 