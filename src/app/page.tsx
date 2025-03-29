"use client";

import { useState, useEffect } from 'react';
import AddIncomeModal from './components/AddIncomeModal';
import AddExpenseModal from './components/AddExpenseModal';
import { RecentTransactions } from './components/RecentTransactions';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchSummary = async () => {
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
        (t: any) => t.recordedBy === user.fullName
      );

      // Filter by selected period
      const now = new Date();
      let startDate = new Date();

      switch (selectedPeriod) {
        case "day":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          startDate = new Date(now.getFullYear(), now.getMonth(), diff);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      filteredTransactions = filteredTransactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate;
      });

      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;

      filteredTransactions.forEach((t: any) => {
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
        balance: totalIncome - totalExpense
      });

    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [user?.fullName, selectedPeriod, refreshTrigger]);

  const handleIncomeSuccess = () => {
    setIsIncomeModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleExpenseSuccess = () => {
    setIsExpenseModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-40 right-40 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Floating Elements */}
      <div className="fixed top-20 left-10 w-4 h-4 bg-blue-500 rounded-full animate-float"></div>
      <div className="fixed top-40 right-20 w-6 h-6 bg-purple-500 rounded-full animate-float animation-delay-1000"></div>
      <div className="fixed bottom-20 left-20 w-5 h-5 bg-pink-500 rounded-full animate-float animation-delay-2000"></div>

      <main className="container mx-auto px-4 py-12 max-w-7xl relative">
        {/* Header Section */}
        <div className="text-center mb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl -z-10"></div>
          <h1 className="text-7xl font-bold mb-8 gradient-text animate-pulse-slow">
            Quản Lý Thu Chi
          </h1>
          <p className="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Theo dõi và quản lý chi tiêu của bạn một cách hiệu quả và thông minh
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-3">
            <span className="text-gray-700 font-medium">Khoảng thời gian:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="glass-card px-6 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm text-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <option value="day">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <button 
            onClick={() => setIsIncomeModalOpen(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-3xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 animate-shine"></div>
            <div className="relative flex items-center justify-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-2xl font-semibold">Thêm Khoản Thu</span>
            </div>
          </button>
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-3xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 animate-shine"></div>
            <div className="relative flex items-center justify-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-2xl font-semibold">Thêm Khoản Chi</span>
            </div>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold gradient-text">Giao Dịch Gần Đây</h2>
            <button className="group glass-button flex items-center gap-2 px-8 py-4 rounded-full hover:bg-white/80 transition-all duration-300">
              <span className="text-blue-600 font-medium text-lg">Xem tất cả</span>
              <svg className="w-6 h-6 text-blue-600 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <RecentTransactions refreshTrigger={refreshTrigger} />
        </div>
      </main>

      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={handleIncomeSuccess}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={handleExpenseSuccess}
      />
    </div>
  );
}
