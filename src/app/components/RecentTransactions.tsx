import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Transaction {
  id: string;
  date: string;
  type: 'Thu' | 'Chi';
  category: string;
  description: string;
  amount: string;
  recordedBy: string;
  notes: string;
  createdAt: string;
}

interface RecentTransactionsProps {
  refreshTrigger?: number;
}

export function RecentTransactions({ refreshTrigger = 0 }: RecentTransactionsProps) {
  const { user } = useAuth();
  const { translate } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tải dữ liệu');
      }

      // Filter transactions by current user and sort by date
      const filteredAndSortedTransactions = [...data.transactions]
        .filter(transaction => transaction.recordedBy === user?.fullName)
        .sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA; // Sắp xếp giảm dần (mới nhất lên đầu)
        });

      setTransactions(filteredAndSortedTransactions);
      setTotalPages(Math.ceil(filteredAndSortedTransactions.length / itemsPerPage));
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.fullName) {
      fetchTransactions();
    }
  }, [user?.fullName]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0 && user?.fullName) {
      fetchTransactions();
    }
  }, [refreshTrigger, user?.fullName]);

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

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => (
    <div
      key={transaction.id}
      className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-6 group hover:bg-slate-800/60 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${
                transaction.type === 'Thu' 
                  ? 'bg-emerald-400/20 text-emerald-400 ring-1 ring-emerald-400/30'
                  : 'bg-rose-400/20 text-rose-400 ring-1 ring-rose-400/30'
              }`}>
                {transaction.type}
              </span>
              <span className="text-sm font-medium text-slate-300">{formatDate(transaction.date)}</span>
            </div>
            <h3 className="mt-3 font-semibold text-white text-xl leading-tight drop-shadow-sm">
              {transaction.description}
            </h3>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="font-medium text-slate-300 bg-slate-700/50 px-3 py-1.5 rounded-full text-sm ring-1 ring-slate-600/50">
                {transaction.category}
              </span>
              {transaction.notes && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{transaction.notes}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold text-2xl tracking-tight ${
              transaction.type === 'Thu' 
                ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                : 'text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.3)]'
            }`}>
              {transaction.type === 'Thu' ? '+' : '-'}
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(Number(transaction.amount))}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-400">
              {transaction.recordedBy}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
        >
          {translate('trang_truoc')}
        </button>
        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, i) => (
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

  if (isLoading) {
    return (
      <div className="p-6 glass-card rounded-xl">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E503C]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 glass-card rounded-xl">
        <div className="flex flex-col items-center justify-center h-40 text-red-500">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 glass-card rounded-xl bg-slate-900/50">
      <div className="flex items-center justify-between mb-8">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-gradient"></div>
          <h2 className="relative text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {translate('giao_dich_gan_day')}
          </h2>
          <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-blue-500/0 via-blue-500/70 to-blue-500/0"></div>
        </div>
        <div className="flex items-center space-x-4 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
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
      
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-4">{translate('chua_co_giao_dich')}</p>
          </div>
        ) : (
          <>
            {getCurrentTransactions().map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
            <Pagination />
          </>
        )}
      </div>
    </div>
  );
} 