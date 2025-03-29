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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold gradient-text">Quản Lý Giao Dịch</h1>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setTransactionType("income");
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm Khoản Thu
          </button>
          <button
            onClick={() => {
              setTransactionType("expense");
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm Khoản Chi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-3xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={(date) => handleFilterChange('startDate', date)}
              onEndDateChange={(date) => handleFilterChange('endDate', date)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
            <select 
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700"
            >
              <option value="">Tất cả</option>
              <option value="income">Thu nhập</option>
              <option value="expense">Chi tiêu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Người ghi</label>
            <select 
              value={filters.recordedBy}
              onChange={(e) => handleFilterChange('recordedBy', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700"
            >
              <option value="">Tất cả</option>
              <option value={user?.fullName}>{user?.fullName}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Ngày</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Loại</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Danh mục</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Mô tả</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Số tiền</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Người ghi</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-red-600">
                      {error}
                </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Không có giao dịch nào
                </td>
              </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.date}</td>
                <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'Thu' 
                            ? 'text-green-800 bg-green-100'
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {transaction.type}
                  </span>
                </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                      <td className={`px-6 py-4 text-sm text-right ${
                        transaction.type === 'Thu' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900">{transaction.recordedBy}</td>
                <td className="px-6 py-4 text-center">
                  <button className="text-blue-600 hover:text-blue-800">
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