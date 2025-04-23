"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import AddIncomeModal from '../components/AddIncomeModal';
import Header from '@/app/components/Header';

export default function IncomePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  const handleSuccess = () => {
    // Nếu muốn chuyển hướng sau khi thêm thành công
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12 text-gray-700">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Thêm Khoản Thu</h1>
              <p className="text-white/80">
                Ghi lại các khoản thu nhập của bạn một cách chi tiết
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-8 border border-gray-100">
          <AddIncomeModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
} 