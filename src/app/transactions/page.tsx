"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import AddIncomeModal from "@/app/components/AddIncomeModal";
import AddExpenseModal from "@/app/components/AddExpenseModal";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import DateRangePicker from '../components/DateRangePicker';
import { useLanguage } from "@/app/contexts/LanguageContext";

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

export default function TransactionsPage() {
  const { user } = useAuth();
  const { translate, language } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: '',
    recordedBy: user?.fullName || ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/transactions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tải dữ liệu');
      }

      // Filter transactions based on current filters
      let filteredTransactions = data.transactions;

      if (filters.recordedBy) {
        filteredTransactions = filteredTransactions.filter(
          (t: Transaction) => t.recordedBy === filters.recordedBy
        );
      }

      if (filters.type) {
        filteredTransactions = filteredTransactions.filter(
          (t: Transaction) => t.type === (filters.type === 'income' ? 'Thu' : 'Chi')
        );
      }

      if (filters.category) {
        filteredTransactions = filteredTransactions.filter(
          (t: Transaction) => t.category === filters.category
        );
      }

      if (filters.startDate) {
        filteredTransactions = filteredTransactions.filter(
          (t: Transaction) => new Date(t.date) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        filteredTransactions = filteredTransactions.filter(
          (t: Transaction) => new Date(t.date) <= new Date(filters.endDate)
        );
      }

      setTransactions(filteredTransactions);
      setTotalPages(Math.ceil(filteredTransactions.length / itemsPerPage));
      setCurrentPage(1); // Reset to first page when filters change
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get current transactions for the current page
  const getCurrentTransactions = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return transactions.slice(indexOfFirstItem, indexOfLastItem);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-6 mb-4 gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          {translate('trang_truoc')}
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`w-10 h-10 rounded-xl font-medium ${
                currentPage === i + 1
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          {translate('trang_sau')}
        </button>
      </div>
    );
  };

  return (
    <ProtectedRoute>
    <div className="container mx-auto px-4 py-8">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {translate('lich_su_giao_dich')}
            </h1>
            <p className="text-slate-300">
              {translate('xem_quan_ly_giao_dich')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setTransactionType("income");
                setShowAddModal(true);
              }}
              className="px-5 md:px-6 py-3 bg-emerald-400/20 text-emerald-400 ring-1 ring-emerald-400/30 rounded-xl hover:bg-emerald-400/30 transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {translate('them_thu_nhap_btn')}
            </button>
            <button
              onClick={() => {
                setTransactionType("expense");
                setShowAddModal(true);
              }}
              className="px-5 md:px-6 py-3 bg-rose-400/20 text-rose-400 ring-1 ring-rose-400/30 rounded-xl hover:bg-rose-400/30 transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {translate('them_chi_tieu_btn')}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative space-y-4">
          {/* DateRangePicker fullwidth on mobile, in its own row */}
          <div>
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={(date) => handleFilterChange('startDate', date)}
              onEndDateChange={(date) => handleFilterChange('endDate', date)}
            />
          </div>
          
          {/* Type and RecordedBy in one row on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{translate('loai')}</label>
              <select 
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 border border-slate-600/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">{translate('tat_ca')}</option>
                <option value="income">{translate('thu_nhap')}</option>
                <option value="expense">{translate('chi_tieu')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{translate('nguoi_ghi')}</label>
              <select 
                value={filters.recordedBy}
                onChange={(e) => handleFilterChange('recordedBy', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 border border-slate-600/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">{translate('tat_ca')}</option>
                <option value={user?.fullName}>{user?.fullName}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        
        {isLoading ? (
          <div className="relative p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-300">{translate('dang_tai_du_lieu')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="relative p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-rose-400/20 text-rose-400 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-4 text-rose-400">{error}</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="relative p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 text-slate-300 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="mt-4 text-slate-300">{translate('chua_co_giao_dich')}</p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setTransactionType("income");
                    setShowAddModal(true);
                  }}
                  className="px-5 py-2.5 bg-emerald-400/20 text-emerald-400 ring-1 ring-emerald-400/30 rounded-xl hover:bg-emerald-400/30 transition-all duration-200"
                >
                  {translate('them_thu_nhap_btn')}
                </button>
                <button
                  onClick={() => {
                    setTransactionType("expense");
                    setShowAddModal(true);
                  }}
                  className="px-5 py-2.5 bg-rose-400/20 text-rose-400 ring-1 ring-rose-400/30 rounded-xl hover:bg-rose-400/30 transition-all duration-200"
                >
                  {translate('them_chi_tieu_btn')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">{translate('ngay')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">{translate('loai')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">{translate('danh_muc')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">{translate('mo_ta')}</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">{translate('so_tien')}</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-slate-300">{translate('nguoi_ghi')}</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-slate-300">{translate('thao_tac')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {getCurrentTransactions().map((transaction) => (
                    <tr key={transaction.id} className="group hover:bg-slate-700/30 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-medium text-slate-300">{formatDate(transaction.date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 text-xs font-medium rounded-full inline-flex items-center justify-center min-w-[80px] ${
                          transaction.type === 'Thu'
                            ? 'bg-emerald-400/20 text-emerald-400 ring-1 ring-emerald-400/30'
                            : 'bg-rose-400/20 text-rose-400 ring-1 ring-rose-400/30'
                        }`}>
                          {transaction.type === 'Thu' ? translate('thu_nhap') : translate('chi_tieu')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-300 bg-slate-700/50 px-3 py-1.5 rounded-full ring-1 ring-slate-600/50">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{transaction.description}</td>
                      <td className={`px-6 py-4 text-base font-bold text-right ${
                        transaction.type === 'Thu'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}>
                        {transaction.type === 'Thu' ? '+' : '-'}
                        {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                          style: 'currency',
                          currency: language === 'vi' ? 'VND' : 'USD'
                        }).format(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-300">{transaction.recordedBy}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Hidden on Desktop */}
            <div className="md:hidden divide-y divide-slate-700/50">
              {getCurrentTransactions().map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-slate-700/30 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full inline-flex items-center justify-center ${
                        transaction.type === 'Thu'
                          ? 'bg-emerald-400/20 text-emerald-400 ring-1 ring-emerald-400/30'
                          : 'bg-rose-400/20 text-rose-400 ring-1 ring-rose-400/30'
                      }`}>
                        {transaction.type === 'Thu' ? translate('thu_nhap') : translate('chi_tieu')}
                      </span>
                      <span className="text-sm text-slate-400">{formatDate(transaction.date)}</span>
                    </div>
                    <div className={`text-base font-bold ${
                      transaction.type === 'Thu'
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}>
                      {transaction.type === 'Thu' ? '+' : '-'}
                      {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: language === 'vi' ? 'VND' : 'USD'
                      }).format(transaction.amount)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-white">{transaction.description}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300 bg-slate-700/50 px-3 py-1.5 rounded-full ring-1 ring-slate-600/50">
                        {transaction.category}
                      </span>
                      <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-sm text-slate-400">{translate('nguoi_ghi')}: {transaction.recordedBy}</div>
                  </div>
                </div>
              ))}
            </div>

            {transactions.length > itemsPerPage && (
              <div className="relative px-4 py-3 border-t border-slate-700/50">
                <Pagination />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && transactionType === "income" && (
        <AddIncomeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchTransactions}
        />
      )}
      {showAddModal && transactionType === "expense" && (
        <AddExpenseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchTransactions}
        />
      )}
    </div>
    </ProtectedRoute>
  );
} 