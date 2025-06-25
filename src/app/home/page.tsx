"use client";

import { useState, useEffect } from 'react';
import AddIncomeModal from '../components/AddIncomeModal';
import AddExpenseModal from '../components/AddExpenseModal';
import { RecentTransactions } from '../components/RecentTransactions';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function HomePage() {
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
  const { translate, language } = useLanguage();

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
    <div className="container mx-auto px-4 py-8">
      {/* Header with subtle gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-8 mb-8 border border-slate-700/30">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">
              {translate('quan_ly_thu_chi')}
            </h1>
            <p className="text-slate-400">
              {translate('theo_doi_thu_chi')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod("day")}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedPeriod === "day"
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
              }`}
            >
              {translate('ngay')}
            </button>
            <button
              onClick={() => setSelectedPeriod("week")}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedPeriod === "week"
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
              }`}
            >
              {translate('tuan')}
            </button>
            <button
              onClick={() => setSelectedPeriod("month")}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedPeriod === "month"
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
              }`}
            >
              {translate('thang')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Summary Cards */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-6 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">{translate('tong_thu')}</h3>
            <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-emerald-400">
              {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                style: 'currency',
                currency: language === 'vi' ? 'VND' : 'USD'
              }).format(summary.totalIncome)}
            </p>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-6 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">{translate('tong_chi')}</h3>
            <div className="p-3 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-full">
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-rose-400">
              {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                style: 'currency',
                currency: language === 'vi' ? 'VND' : 'USD'
              }).format(summary.totalExpense)}
            </p>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-6 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">{translate('so_du')}</h3>
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
          ) : (
            <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                style: 'currency',
                currency: language === 'vi' ? 'VND' : 'USD'
              }).format(summary.balance)}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => setIsIncomeModalOpen(true)}
          className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-6 hover:bg-slate-800/70 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all duration-300">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-200">{translate('them_khoan_thu')}</h3>
              <p className="text-slate-400">{translate('them_thu_nhap')}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-6 hover:bg-slate-800/70 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-full group-hover:from-rose-500/30 group-hover:to-pink-500/30 transition-all duration-300">
              <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-200">{translate('them_khoan_chi')}</h3>
              <p className="text-slate-400">{translate('them_chi_tieu')}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-gradient"></div>
              <h2 className="relative text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {translate('giao_dich_gan_day')}
              </h2>
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-blue-500/0 via-blue-500/70 to-blue-500/0"></div>
              <p className="relative mt-2 text-sm text-slate-300">
                Các giao dịch gần đây của bạn
              </p>
            </div>
            <div className="flex items-center space-x-4 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                <span className="text-sm font-medium text-slate-300">Thu</span>
              </div>
              <div className="w-px h-4 bg-slate-700/50"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]"></div>
                <span className="text-sm font-medium text-slate-300">Chi</span>
              </div>
            </div>
          </div>
          <RecentTransactions refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Modals */}
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