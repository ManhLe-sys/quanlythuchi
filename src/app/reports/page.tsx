"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import DateRangePicker from "../components/DateRangePicker";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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

      filteredTransactions.forEach((t: Transaction) => {
        const amount = Number(t.amount);
        if (isNaN(amount)) return;

        if (t.type === 'Thu') {
          totalIncome += amount;
        } else if (t.type === 'Chi') {
          totalExpense += amount;
        }
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

  useEffect(() => {
    fetchTransactions();
  }, [user?.fullName, dateRange.startDate, dateRange.endDate]);

  // Prepare data for time-based chart
  const timeChartData = () => {
    const data: { [key: string]: { Thu: number; Chi: number } } = {};
    
    summary.transactions.forEach((t: Transaction) => {
      const date = t.date.split('T')[0];
      if (!data[date]) {
        data[date] = { Thu: 0, Chi: 0 };
      }
      if (t.type === 'Thu') {
        data[date].Thu += Number(t.amount);
      } else {
        data[date].Chi += Number(t.amount);
      }
    });

    return Object.entries(data).map(([date, values]) => ({
      date,
      ...values
    }));
  };

  // Prepare data for category-based chart
  const categoryChartData = () => {
    const data: { [key: string]: number } = {};
    
    summary.transactions.forEach((t: Transaction) => {
      if (t.type === 'Chi') {
        if (!data[t.category]) {
          data[t.category] = 0;
        }
        data[t.category] += Number(t.amount);
      }
    });

    return Object.entries(data).map(([name, value]) => ({
      name,
      value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section with Background */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-3xl"></div>
        <div className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-green-600">Báo Cáo</span>{" "}
                <span className="text-gray-800">Thu Chi</span>
              </h1>
              <p className="text-gray-600">
                Thống kê chi tiết thu chi theo thời gian và danh mục
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as "day" | "week" | "month" | "year")}
                  className="w-full md:w-auto pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer appearance-none text-gray-700 font-medium shadow-sm hover:shadow-md"
                >
                  <option value="day">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                  <option value="year">Năm nay</option>
                </select>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 md:flex-none">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onStartDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  onEndDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-3xl hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Tổng Thu</h3>
              <p className="text-sm text-gray-500">Tổng thu nhập trong kỳ</p>
            </div>
            <div className="p-3 bg-green-100 rounded-2xl">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-green-600 mb-2">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(summary.totalIncome)}
              </p>
              <div className="flex items-center text-sm text-green-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Cập nhật mới nhất</span>
              </div>
            </>
          )}
        </div>

        <div className="glass-card p-6 rounded-3xl hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Tổng Chi</h3>
              <p className="text-sm text-gray-500">Tổng chi tiêu trong kỳ</p>
            </div>
            <div className="p-3 bg-red-100 rounded-2xl">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-red-600 mb-2">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(summary.totalExpense)}
              </p>
              <div className="flex items-center text-sm text-red-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
                <span>Cập nhật mới nhất</span>
              </div>
            </>
          )}
        </div>

        <div className="glass-card p-6 rounded-3xl hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Số Dư</h3>
              <p className="text-sm text-gray-500">Chênh lệch thu chi</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-2xl">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <>
              <p className={`text-3xl font-bold mb-2 ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(summary.balance)}
              </p>
              <div className={`flex items-center text-sm ${summary.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d={summary.balance >= 0 
                      ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} />
                </svg>
                <span>Cập nhật mới nhất</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Thu Chi Theo Thời Gian</h3>
          <div className="h-80">
            {isLoading ? (
              <div className="animate-pulse h-full bg-gray-200 rounded"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Thu" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="Chi" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Chi Tiêu Theo Danh Mục</h3>
          <div className="h-80">
            {isLoading ? (
              <div className="animate-pulse h-full bg-gray-200 rounded"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
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
                    <div className="animate-pulse">
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
                    Không có dữ liệu cho khoảng thời gian này
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
                        acc[category].income += Number(t.amount);
                      } else {
                        acc[category].expense += Number(t.amount);
                      }
                      return acc;
                    }, {} as Record<string, { income: number; expense: number }>)
                  ).map(([category, data]) => {
                    const balance = data.income - data.expense;
                    const percentage = ((data.expense / summary.totalExpense) * 100).toFixed(1);
                    
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