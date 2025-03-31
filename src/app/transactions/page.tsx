"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import AddIncomeModal from "@/app/components/AddIncomeModal";
import AddExpenseModal from "@/app/components/AddExpenseModal";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import DateRangePicker from '../components/DateRangePicker';

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

  return (
    <ProtectedRoute>
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
         <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Lịch Sử Giao Dịch</h1>
            <p className="text-white/80">
              Xem và quản lý tất cả các giao dịch thu chi của bạn
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setTransactionType("income");
                setShowAddModal(true);
              }}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm Thu Nhập
            </button>
            <button
              onClick={() => {
                setTransactionType("expense");
                setShowAddModal(true);
              }}
              className="px-6 py-3 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm Chi Tiêu
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={(date) => handleFilterChange('startDate', date)}
              onEndDateChange={(date) => handleFilterChange('endDate', date)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Loại</label>
            <select 
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Tất cả</option>
              <option value="income">Thu nhập</option>
              <option value="expense">Chi tiêu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Người ghi</label>
            <select 
              value={filters.recordedBy}
              onChange={(e) => handleFilterChange('recordedBy', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Tất cả</option>
              <option value={user?.fullName}>{user?.fullName}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Ngày</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Loại</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Danh mục</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Mô tả</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">Số tiền</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">Người ghi</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600">Đang tải dữ liệu giao dịch...</p>
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
                      <p className="text-gray-500">Chưa có giao dịch nào</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setTransactionType("income");
                            setShowAddModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          Thêm Thu Nhập
                        </button>
                        <button
                          onClick={() => {
                            setTransactionType("expense");
                            setShowAddModal(true);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                        >
                          Thêm Chi Tiêu
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm font-medium">{transaction.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full inline-flex items-center justify-center min-w-[80px] ${
                        transaction.type === 'Thu' 
                          ? 'text-green-800 bg-green-100'
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {transaction.type === 'Thu' ? 'Thu nhập' : 'Chi tiêu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{transaction.category}</td>
                    <td className="px-6 py-4 text-sm">{transaction.description}</td>
                    <td className={`px-6 py-4 text-sm font-medium text-right ${
                      transaction.type === 'Thu' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">{transaction.recordedBy}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
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