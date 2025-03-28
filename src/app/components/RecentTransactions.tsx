import { useEffect, useState } from 'react';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tải dữ liệu');
      }

      setTransactions(data.transactions);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchTransactions();
    }
  }, [refreshTrigger]);

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => (
    <div
      key={transaction.id}
      className="p-4 bg-white/50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              transaction.type === 'Thu' 
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {transaction.type}
            </span>
            <span className="text-sm text-gray-500">{transaction.date}</span>
          </div>
          <h3 className="mt-1 font-medium text-[#3E503C]">
            {transaction.description}
          </h3>
          <div className="mt-1 text-sm text-gray-500">
            {transaction.category}
          </div>
        </div>
        <div className="text-right">
          <div className={`font-semibold ${
            transaction.type === 'Thu' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.type === 'Thu' ? '+' : '-'}
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(Number(transaction.amount))}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {transaction.recordedBy}
          </div>
        </div>
      </div>
      {transaction.notes && (
        <div className="mt-2 text-sm text-gray-500">
          <span className="font-medium">Ghi chú:</span> {transaction.notes}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 glass-card rounded-xl">
      <h2 className="text-xl font-semibold mb-6 text-[#3E503C]">Giao Dịch Gần Đây</h2>
      
      <div className="space-y-4">
        {transactions.length === 0 && !isLoading ? (
          <p className="text-center text-gray-500">Chưa có giao dịch nào</p>
        ) : (
          <>
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 