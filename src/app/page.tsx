"use client";

import { useState } from 'react';
import AddIncomeModal from './components/AddIncomeModal';
import AddExpenseModal from './components/AddExpenseModal';
import { RecentTransactions } from './components/RecentTransactions';

export default function Home() {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleIncomeSuccess = () => {
    setIsIncomeModalOpen(false);
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  const handleExpenseSuccess = () => {
    setIsExpenseModalOpen(false);
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="glass-card p-8 rounded-3xl hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-700">Tổng Thu</h3>
                <div className="p-4 bg-green-100/80 backdrop-blur-sm rounded-full animate-pulse-slow">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-6xl font-bold text-green-600 mb-4">0đ</p>
              <div className="flex items-center text-sm text-green-500">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>+0% so với tháng trước</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-700">Tổng Chi</h3>
                <div className="p-4 bg-red-100/80 backdrop-blur-sm rounded-full animate-pulse-slow">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-6xl font-bold text-red-600 mb-4">0đ</p>
              <div className="flex items-center text-sm text-red-500">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
                <span>+0% so với tháng trước</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-700">Số Dư</h3>
                <div className="p-4 bg-blue-100/80 backdrop-blur-sm rounded-full animate-pulse-slow">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-6xl font-bold text-blue-600 mb-4">0đ</p>
              <div className="flex items-center text-sm text-blue-500">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>+0% so với tháng trước</span>
              </div>
            </div>
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
