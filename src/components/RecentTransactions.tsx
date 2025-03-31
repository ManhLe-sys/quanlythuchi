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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Ngày</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Mô tả</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Danh mục</th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">Số tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-[#3E503C] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center">
                <div className="flex flex-col items-center gap-4 text-red-500">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{error}</p>
                </div>
              </td>
            </tr>
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center">
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>Chưa có giao dịch nào</p>
                </div>
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-600">
                  {new Date(transaction.date).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{transaction.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    transaction.type === 'income' 
                      ? 'bg-[#3E503C]/10 text-[#3E503C] ring-1 ring-[#3E503C]/10'
                      : 'bg-[#FF6F3D]/10 text-[#FF6F3D] ring-1 ring-[#FF6F3D]/10'
                  }`}>
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${
                    transaction.type === 'income' ? 'text-[#3E503C]' : 'text-[#FF6F3D]'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(transaction.amount)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 