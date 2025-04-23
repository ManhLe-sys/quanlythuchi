"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import DateRangePicker from "../components/DateRangePicker";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

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

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("month");
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchTransactions = async () => {
    if (!user?.fullName) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/transactions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tải dữ liệu');
      }

      // Filter transactions by user
      let filteredTransactions = data.transactions.filter(
        (t: Transaction) => t.recordedBy === user.fullName
      );

      // Filter by date range
      if (dateRange.startDate && dateRange.endDate) {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);

        filteredTransactions = filteredTransactions.filter((t: Transaction) => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }

      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;

      filteredTransactions.forEach((t: Transaction) => {
        const amount = Number(t.amount);
        if (isNaN(amount)) return;

        if (t.type === 'Thu') {
          totalIncome += amount;
        } else if (t.type === 'Chi') {
          totalExpense += amount;
        }
      });

      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactions: filteredTransactions
      });

      setError(null);
    } catch (err) {
      console.error('Error in fetchTransactions:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  // Update date range based on time range selection
  useEffect(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (timeRange) {
      case "day":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        // Get first day of week (Monday)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff);
        end = new Date(now.getFullYear(), now.getMonth(), diff + 6);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  }, [timeRange]);

  useEffect(() => {
    fetchTransactions();
  }, [user?.fullName, dateRange.startDate, dateRange.endDate]);

  // Prepare data for time-based chart
  const timeChartData = () => {
    const data: { [key: string]: { Thu: number; Chi: number } } = {};
    
    summary.transactions.forEach((t: Transaction) => {
      const date = t.date.split('T')[0];
      if (!data[date]) {
        data[date] = { Thu: 0, Chi: 0 };
      }
      if (t.type === 'Thu') {
        data[date].Thu += Number(t.amount);
      } else {
        data[date].Chi += Number(t.amount);
      }
    });

    return Object.entries(data).map(([date, values]) => ({
      date,
      ...values
    }));
  };

  // Prepare data for category-based chart
  const categoryChartData = () => {
    const data: { [key: string]: number } = {};
    
    summary.transactions.forEach((t: Transaction) => {
      if (t.type === 'Chi') {
        if (!data[t.category]) {
          data[t.category] = 0;
        }
        data[t.category] += Number(t.amount);
      }
    });

    return Object.entries(data).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Update the PDF export function to use html2canvas
  const exportToPdf = async () => {
    if (!reportRef.current) return;
    
    try {
      // Add loading state
      setIsLoading(true);
      
      // Create PDF with Vietnamese support
      const pdf = new jsPDF();
      
      // Define styles for Vietnamese text rendering with correct type
      const textOptions = { align: 'left' as const };
      
      // Add title - use encoded text for Vietnamese support
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bao Cao Thu Chi', 14, 22, textOptions);
      
      // Add date range
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tu ngay ${dateRange.startDate} den ngay ${dateRange.endDate}`, 14, 30, textOptions);
      
      // Add summary information
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tong Ket:', 14, 40, textOptions);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tong Thu Nhap: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(summary.totalIncome)}`, 14, 48, textOptions);
      
      pdf.text(`Tong Chi Tieu: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(summary.totalExpense)}`, 14, 56, textOptions);
      
      pdf.text(`So Du: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(summary.balance)}`, 14, 64, textOptions);
      
      // Add transactions table - using plain ASCII characters for headers
      const tableColumn = ["Ngay", "Loai", "Danh muc", "Mo ta", "So tien"];
      const tableRows = summary.transactions.map(item => [
        new Date(item.date).toLocaleDateString('vi-VN'),
        item.type === 'Thu' ? 'Thu' : 'Chi',
        item.category,
        item.description,
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(item.amount)
      ]);
      
      // Use autoTable with simplified font settings
      autoTable(pdf, {
        startY: 75,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 10
        },
        headStyles: {
          fillColor: [62, 80, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        }
      });
      
      // Save the PDF
      pdf.save('bao-cao-thu-chi.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Có lỗi khi tạo file PDF. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const exportToExcel = () => {
    // Prepare the data
    const worksheet = XLSX.utils.json_to_sheet(
      summary.transactions.map(item => ({
        'Ngày': new Date(item.date).toLocaleDateString('vi-VN'),
        'Loại': item.type,
        'Danh mục': item.category,
        'Mô tả': item.description,
        'Số tiền': item.amount,
        'Ghi chú': item.notes || ''
      }))
    );
    
    // Add summary information at the top
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['Báo Cáo Thu Chi'],
      [`Từ ngày ${dateRange.startDate} đến ngày ${dateRange.endDate}`],
      [''],
      ['Tổng Thu Nhập', summary.totalIncome],
      ['Tổng Chi Tiêu', summary.totalExpense],
      ['Số Dư', summary.balance],
      ['']
    ], { origin: 'A1' });
    
    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo Thu Chi');
    
    // Generate and download Excel file
    XLSX.writeFile(workbook, 'bao-cao-thu-chi.xlsx');
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Báo Cáo Thu Chi</h1>
            <p className="text-white/80">
              Thống kê chi tiết thu chi theo thời gian và danh mục
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as "day" | "week" | "month" | "year")}
                className="w-full md:w-auto pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E503C] focus:border-transparent transition-all duration-200 cursor-pointer appearance-none text-gray-700 font-medium shadow-sm hover:shadow-md"
              >
                <option value="day">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="year">Năm nay</option>
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex-1 md:flex-none">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onStartDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                onEndDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
              />
            </div>
            
            {/* Export buttons */}
            <div className="flex gap-2">
              <button 
                onClick={exportToPdf}
                className="px-4 py-2.5 bg-white rounded-xl text-gray-700 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a2 2 0 002 2h4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v6" />
                </svg>
                <span className="text-gray-700">PDF</span>
              </button>
              <button 
                onClick={exportToExcel}
                className="px-4 py-2.5 bg-white rounded-xl text-gray-700 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a2 2 0 002 2h4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 12L8 16M14 12l2 4M10 16l4 0" />
                </svg>
                <span className="text-gray-700">Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report content - add ref for PDF export */}
      <div ref={reportRef}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Thu Nhập Card */}
          <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Thu Nhập</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(summary.totalIncome)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Chi Tiêu Card */}
          <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Chi Tiêu</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(summary.totalExpense)}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Số Dư Card */}
          <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#3E503C]">Số Dư</p>
                <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-[#3E503C]' : 'text-[#FF6F3D]'}`}>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(summary.balance)}
                </p>
              </div>
              <div className="h-12 w-12 bg-[#3E503C]/10 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#3E503C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Time-based Chart */}
          <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">Biểu Đồ Thu Chi Theo Thời Gian</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Thu" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                  <Line type="monotone" dataKey="Chi" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category-based Chart */}
          <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">Biểu Đồ Chi Tiêu Theo Danh Mục</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#3E503C] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col items-center gap-4 text-red-600">
              <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-[#3E503C] text-white rounded-xl hover:bg-[#7F886A] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 