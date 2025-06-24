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

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-6 mb-4 gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
        >
          {translate('trang_truoc')}
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`w-8 h-8 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-[#3E503C] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
        >
          {translate('trang_sau')}
        </button>
      </div>
    );
  };

  return (
    <ProtectedRoute>
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
         <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{translate('lich_su_giao_dich')}</h1>
            <p className="text-white/80">
              {translate('xem_quan_ly_giao_dich')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setTransactionType("income");
                setShowAddModal(true);
              }}
              className="px-5 md:px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="whitespace-nowrap">{translate('them_thu_nhap_btn')}</span>
            </button>
            <button
              onClick={() => {
                setTransactionType("expense");
                setShowAddModal(true);
              }}
              className="px-5 md:px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="whitespace-nowrap">{translate('them_chi_tieu_btn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-4 md:p-6 mb-8 border border-gray-100">
        <h2 className="font-medium text-gray-700 mb-3 md:hidden">Bộ lọc</h2>
        
        <div className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{translate('loai')}</label>
              <select 
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent transition-all duration-200"
              >
                <option value="">{translate('tat_ca')}</option>
                <option value="income">{translate('thu_nhap')}</option>
                <option value="expense">{translate('chi_tieu')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{translate('nguoi_ghi')}</label>
              <select 
                value={filters.recordedBy}
                onChange={(e) => handleFilterChange('recordedBy', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent transition-all duration-200"
              >
                <option value="">{translate('tat_ca')}</option>
                <option value={user?.fullName}>{user?.fullName}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table (Desktop) and Cards (Mobile) */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden border border-gray-100">
        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">{translate('ngay')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">{translate('loai')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">{translate('danh_muc')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">{translate('mo_ta')}</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">{translate('so_tien')}</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">{translate('nguoi_ghi')}</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">{translate('thao_tac')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-[#3E503C] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-700">{translate('dang_tai_du_lieu')}</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-4 text-red-600">
                      <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="font-medium">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-24 w-24 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center">
                        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-gray-700">{translate('chua_co_giao_dich')}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setTransactionType("income");
                            setShowAddModal(true);
                          }}
                          className="px-4 py-2 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          {translate('them_thu_nhap_btn')}
                        </button>
                        <button
                          onClick={() => {
                            setTransactionType("expense");
                            setShowAddModal(true);
                          }}
                          className="px-4 py-2 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          {translate('them_chi_tieu_btn')}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                getCurrentTransactions().map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm font-medium">{transaction.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full inline-flex items-center justify-center min-w-[80px] ${
                        transaction.type === 'Thu' 
                          ? 'text-green-800 bg-green-100'
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {transaction.type === 'Thu' ? translate('thu_nhap') : translate('chi_tieu')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{transaction.category}</td>
                    <td className="px-6 py-4 text-sm">{transaction.description}</td>
                    <td className={`px-6 py-4 text-sm font-medium text-right ${
                      transaction.type === 'Thu' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: language === 'vi' ? 'VND' : 'USD'
                      }).format(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">{transaction.recordedBy}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-[#3E503C] hover:text-[#7F886A] hover:bg-[#3E503C]/10 rounded-lg transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      
        {/* Mobile Card View - Hidden on Desktop */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="px-6 py-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#3E503C] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-700">{translate('dang_tai_du_lieu')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center">
              <div className="flex flex-col items-center gap-4 text-red-600">
                <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-gray-700">{translate('chua_co_giao_dich')}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setTransactionType("income");
                      setShowAddModal(true);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {translate('them_thu_nhap_btn')}
                  </button>
                  <button
                    onClick={() => {
                      setTransactionType("expense");
                      setShowAddModal(true);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {translate('them_chi_tieu_btn')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {getCurrentTransactions().map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-blue-50/30 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center justify-center ${
                        transaction.type === 'Thu' 
                          ? 'text-green-800 bg-green-100'
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {transaction.type === 'Thu' ? translate('thu_nhap') : translate('chi_tieu')}
                      </span>
                      <span className="text-sm text-gray-500">{transaction.date}</span>
                    </div>
                    <div className={`text-base font-medium ${
                      transaction.type === 'Thu' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: language === 'vi' ? 'VND' : 'USD'
                      }).format(transaction.amount)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="font-medium text-gray-900">{transaction.description}</div>
                    <div className="flex justify-between">
                      <div className="text-gray-600">{translate('danh_muc')}: {transaction.category}</div>
                      <button className="p-1.5 text-[#3E503C] hover:text-[#7F886A] hover:bg-[#3E503C]/10 rounded-lg transition-colors duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-gray-500 text-xs">{translate('nguoi_ghi')}: {transaction.recordedBy}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      
        {!isLoading && !error && transactions.length > 0 && (
          <div className="px-4 py-3">
            <Pagination />
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