import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

interface RecentTransactionsProps {
  refreshTrigger: number;
}

export default function RecentTransactions({ refreshTrigger }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/transactions/recent');
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-rose-400">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-4">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="mt-4">Chưa có giao dịch nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="bg-[#94A3B8] bg-opacity-30 rounded-2xl px-4 py-3"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-5 rounded-full ${
                transaction.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></div>
              <span className="text-white text-sm">
                {new Date(transaction.date).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </span>
            </div>
            <div className="text-right">
              <p className={`text-base font-medium ${
                transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}
                {transaction.amount.toLocaleString()} đ
              </p>
              <p className="text-sm text-white opacity-80">Mạnh Ken</p>
            </div>
          </div>
          <div>
            <p className="text-lg font-medium text-white mb-0.5">
              {transaction.amount.toLocaleString()} đ
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white opacity-80">{transaction.category}</span>
              <span className="text-white opacity-50">•</span>
              <span className="text-sm text-white opacity-80">Ghi chú: {transaction.description}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 