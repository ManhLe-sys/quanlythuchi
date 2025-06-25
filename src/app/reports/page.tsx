"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
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
  Cell,
  BarChart,
  Bar
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

interface OrderItem {
  ma_mon: string;
  ten_mon: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

interface Order {
  ma_don: string;
  ngay_dat: string;
  tong_tien: number;
  trang_thai: string;
  trang_thai_thanh_toan: string;
  phuong_thuc_thanh_toan: string;
  danh_sach_mon: OrderItem[];
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  totalOrders: number;
  totalOrderValue: number;
  balance: number;
  transactions: Transaction[];
  orders: Order[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export default function ReportsPage() {
  const { user } = useAuth();
  const { translate, language } = useLanguage();
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("month");
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    totalOrders: 0,
    totalOrderValue: 0,
    balance: 0,
    transactions: [],
    orders: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<"transactions" | "orders">("transactions");
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!user?.fullName) return;
    
    try {
      setIsLoading(true);
      
      // Fetch transactions
      const transactionResponse = await fetch('/api/transactions');
      const transactionData = await transactionResponse.json();

      if (!transactionResponse.ok) {
        throw new Error(transactionData.error || 'Có lỗi xảy ra khi tải dữ liệu giao dịch');
      }

      // Fetch orders
      const orderResponse = await fetch('/api/orders');
      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Có lỗi xảy ra khi tải dữ liệu đơn hàng');
      }

      console.log('Data từ API orders:', orderData); // Debug data

      // Filter transactions by user
      let filteredTransactions = transactionData.transactions.filter(
        (t: Transaction) => t.recordedBy === user.fullName
      );

      // Process orders data
      let processedOrders: Order[] = [];
      if (orderData.success && orderData.data && Array.isArray(orderData.data.orders)) {
        processedOrders = orderData.data.orders.map((order: any) => {
          // Kiểm tra và chuyển đổi dữ liệu chi tiết đơn hàng
          let danhSachMon: OrderItem[] = [];
          if (Array.isArray(order.chi_tiet_don_hang)) {
            danhSachMon = order.chi_tiet_don_hang;
          } else if (Array.isArray(order.danh_sach_mon)) {
            danhSachMon = order.danh_sach_mon;
          } else if (typeof order.chi_tiet_don_hang === 'string') {
            try {
              danhSachMon = JSON.parse(order.chi_tiet_don_hang);
            } catch (e) {
              console.error('Lỗi parse chi tiết đơn hàng:', e);
            }
          }

          // Chuẩn hóa các trường dữ liệu
          return {
            ma_don: order.ma_don || '',
            ngay_dat: order.ngay_dat || new Date().toISOString(),
            tong_tien: Number(order.tong_tien) || 0,
            trang_thai: order.trang_thai || 'Chờ xử lý',
            trang_thai_thanh_toan: order.trang_thai_thanh_toan || 'Chưa thanh toán',
            phuong_thuc_thanh_toan: order.phuong_thuc_thanh_toan || 'Chưa xác định',
            danh_sach_mon: danhSachMon.map((item: any, index: number) => ({
              ma_mon: item.ma_mon || '',
              ten_mon: item.ten_mon || '',
              so_luong: Number(item.so_luong) || 0,
              don_gia: Number(item.don_gia) || 0,
              thanh_tien: Number(item.thanh_tien) || 0
            }))
          };
        });
      }

      // Filter orders by date range
      if (dateRange.startDate && dateRange.endDate) {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);

        // Filter transactions
        filteredTransactions = filteredTransactions.filter((t: Transaction) => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });

        // Filter orders
        processedOrders = processedOrders.filter((o: Order) => {
          const orderDate = new Date(o.ngay_dat);
          return orderDate >= startDate && orderDate <= endDate;
        });
      }

      // Calculate totals for transactions
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

      // Calculate totals for orders
      const totalOrders = processedOrders.length;
      const totalOrderValue = processedOrders.reduce((sum: number, order: Order) => 
        sum + order.tong_tien, 0);

      setSummary({
        totalIncome,
        totalExpense,
        totalOrders,
        totalOrderValue,
        balance: totalIncome - totalExpense,
        transactions: filteredTransactions,
        orders: processedOrders
      });

      setError(null);
    } catch (err) {
      console.error('Error in fetchData:', err);
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
    fetchData();
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

  // Add order-specific data preparation
  const ordersByDateData = () => {
    const data: { [key: string]: number } = {};
    
    summary.orders.forEach((order: Order) => {
      // Chuyển đổi chuỗi ngày thành chuỗi ngày yyyy-mm-dd để nhóm theo ngày
      const dateObj = new Date(order.ngay_dat);
      const date = dateObj.toISOString().split('T')[0];
      
      if (!data[date]) {
        data[date] = 0;
      }
      data[date] += order.tong_tien;
    });

    return Object.entries(data)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, value]) => ({
        date,
        value
      }));
  };

  const ordersByProductData = () => {
    const data: { [key: string]: number } = {};
    
    summary.orders.forEach((order: Order) => {
      if (Array.isArray(order.danh_sach_mon)) {
        order.danh_sach_mon.forEach((item: OrderItem) => {
          // Sử dụng tên món làm key, nếu không có tên thì dùng mã món
          const productName = item.ten_mon || item.ma_mon || 'Không xác định';
          
          if (!data[productName]) {
            data[productName] = 0;
          }
          data[productName] += item.thanh_tien;
        });
      }
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 products
  };

  // Add a new function to analyze order status
  const ordersByStatusData = () => {
    const data: { [key: string]: number } = {};
    
    summary.orders.forEach((order: Order) => {
      const status = order.trang_thai || 'Không xác định';
      
      if (!data[status]) {
        data[status] = 0;
      }
      data[status]++;
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }));
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
      
      // Add title - use simplified text without accents for better compatibility
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(translate('bao_cao'), 14, 22, textOptions);
      
      // Add date range - simplify text
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tu ngay ${dateRange.startDate} den ngay ${dateRange.endDate}`, 14, 30, textOptions);
      
      // Add summary information
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tong Ket:', 14, 40, textOptions);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tong Thu Nhap: ${new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: language === 'vi' ? 'VND' : 'USD'
      }).format(summary.totalIncome)}`, 14, 48, textOptions);
      
      pdf.text(`Tong Chi Tieu: ${new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: language === 'vi' ? 'VND' : 'USD'
      }).format(summary.totalExpense)}`, 14, 56, textOptions);
      
      pdf.text(`So Du: ${new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: language === 'vi' ? 'VND' : 'USD'
      }).format(summary.balance)}`, 14, 64, textOptions);
      
      // Add transactions table - using plain ASCII characters for headers
      const tableColumn = ["Ngay", "Loai", "Danh muc", "Mo ta", "So tien"];
      const tableRows = summary.transactions.map(item => [
        new Date(item.date).toLocaleDateString('vi-VN'),
        item.type === 'Thu' ? 'Thu' : 'Chi',
        item.category,
        item.description,
        new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
          style: 'currency',
          currency: language === 'vi' ? 'VND' : 'USD'
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
      
      // Add order data to PDF if on orders tab
      if (activeReport === "orders") {
        // Create a new PDF to avoid page overflow issues
        const orderPdf = new jsPDF();
        
        // Add title for order report
        orderPdf.setFontSize(18);
        orderPdf.setFont('helvetica', 'bold');
        orderPdf.text(translate('bao_cao_don_hang'), 14, 22, textOptions);
        
        // Add date range
        orderPdf.setFontSize(12);
        orderPdf.setFont('helvetica', 'normal');
        orderPdf.text(`Tu ngay ${dateRange.startDate} den ngay ${dateRange.endDate}`, 14, 30, textOptions);
        
        // Add order summary
        orderPdf.setFontSize(14);
        orderPdf.setFont('helvetica', 'bold');
        orderPdf.text('Tong Ket Don Hang:', 14, 40, textOptions);
        
        orderPdf.setFontSize(12);
        orderPdf.setFont('helvetica', 'normal');
        orderPdf.text(`Tong So Don Hang: ${summary.totalOrders}`, 14, 48, textOptions);
        
        orderPdf.text(`Tong Gia Tri Don Hang: ${new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
          style: 'currency',
          currency: language === 'vi' ? 'VND' : 'USD'
        }).format(summary.totalOrderValue)}`, 14, 56, textOptions);
        
        // Add orders table - simplify column names
        const orderTableColumn = ["Ma Don", "Ngay Dat", "Tong Tien", "Trang Thai", "Thanh Toan"];
        const orderTableRows = summary.orders.map(item => [
          item.ma_don,
          new Date(item.ngay_dat).toLocaleDateString('vi-VN'),
          new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
            style: 'currency',
            currency: language === 'vi' ? 'VND' : 'USD'
          }).format(item.tong_tien),
          item.trang_thai,
          item.trang_thai_thanh_toan
        ]);
        
        autoTable(orderPdf, {
          startY: 75,
          head: [orderTableColumn],
          body: orderTableRows,
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
        
        // Save the order PDF
        orderPdf.save('bao-cao-don-hang.pdf');
      } else {
        // Save the transaction PDF
        pdf.save('bao-cao-thu-chi.pdf');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Có lỗi khi tạo file PDF. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const exportToExcel = () => {
    if (activeReport === "transactions") {
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
    } else {
      // Create worksheet for orders
      const worksheet = XLSX.utils.json_to_sheet(
        summary.orders.map(item => ({
          'Mã Đơn': item.ma_don,
          'Ngày Đặt': new Date(item.ngay_dat).toLocaleDateString('vi-VN'),
          'Tổng Tiền': item.tong_tien,
          'Trạng Thái': item.trang_thai,
          'Thanh Toán': item.trang_thai_thanh_toan,
          'Phương Thức': item.phuong_thuc_thanh_toan
        }))
      );
      
      // Add summary information at the top
      XLSX.utils.sheet_add_aoa(worksheet, [
        ['Báo Cáo Đơn Hàng'],
        [`Từ ngày ${dateRange.startDate} đến ngày ${dateRange.endDate}`],
        [''],
        ['Tổng Số Đơn Hàng', summary.totalOrders],
        ['Tổng Giá Trị Đơn Hàng', summary.totalOrderValue],
        ['']
      ], { origin: 'A1' });
      
      // Create workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo Đơn Hàng');
      
      // Generate and download Excel file - REMOVED PRODUCTS DETAIL WORKSHEET
      XLSX.writeFile(workbook, 'bao-cao-don-hang.xlsx');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{translate('bao_cao')}</h1>
            <p className="text-white/80">
              {translate('thong_ke_chi_tiet')}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as "day" | "week" | "month" | "year")}
                className="w-full md:w-auto pl-10 pr-10 py-2.5 bg-slate-800/50 backdrop-blur-xl text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 cursor-pointer appearance-none font-medium shadow-lg hover:shadow-xl"
              >
                <option value="day">{translate('ngay')}</option>
                <option value="week">{translate('tuan')}</option>
                <option value="month">{translate('thang')}</option>
                <option value="year">{translate('nam')}</option>
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="px-4 py-2.5 bg-slate-800/50 backdrop-blur-xl rounded-xl text-white font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-white/20 hover:bg-slate-700/50 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a2 2 0 002 2h4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v6" />
                </svg>
                <span>PDF</span>
              </button>
              <button 
                onClick={exportToExcel}
                className="px-4 py-2.5 bg-slate-800/50 backdrop-blur-xl rounded-xl text-white font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-white/20 hover:bg-slate-700/50 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a2 2 0 002 2h4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 12L8 16M14 12l2 4M10 16l4 0" />
                </svg>
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex mb-6 gap-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReport("transactions")}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeReport === "transactions" ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {translate('bao_cao_thu_chi')}
        </button>
        <button
          onClick={() => setActiveReport("orders")}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeReport === "orders" ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {translate('bao_cao_don_hang')}
        </button>
      </div>

      {/* Report content - add ref for PDF export */}
      <div ref={reportRef}>
        {activeReport === "transactions" ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Thu Nhập Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{translate('tong_thu_nhap')}</p>
                    <p className="text-2xl font-bold text-white mt-1 drop-shadow-lg">
                      {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: language === 'vi' ? 'VND' : 'USD'
                      }).format(summary.totalIncome)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Chi Tiêu Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{translate('tong_chi_tieu')}</p>
                    <p className="text-2xl font-bold text-white mt-1 drop-shadow-lg">
                      {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: language === 'vi' ? 'VND' : 'USD'
                      }).format(summary.totalExpense)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Số Dư Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{translate('so_du')}</p>
                    <p className={`text-2xl font-bold mt-1 drop-shadow-lg ${
                      summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: language === 'vi' ? 'VND' : 'USD'
                      }).format(summary.balance)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Time-based Chart */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative">
                  <h3 className="text-lg font-semibold text-white mb-6">{translate('bieu_do_thu_chi_thoi_gian')}</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                        <YAxis stroke="rgba(255,255,255,0.6)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                            color: 'white'
                          }}
                          formatter={(value: any) => new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                            style: 'currency',
                            currency: language === 'vi' ? 'VND' : 'USD'
                          }).format(Number(value))}
                          labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        />
                        <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)' }} />
                        <Line 
                          type="monotone" 
                          dataKey="Thu" 
                          stroke="#34D399" 
                          strokeWidth={3}
                          dot={{ fill: '#34D399', strokeWidth: 2 }}
                          activeDot={{ r: 8, strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Chi" 
                          stroke="#FB7185" 
                          strokeWidth={3}
                          dot={{ fill: '#FB7185', strokeWidth: 2 }}
                          activeDot={{ r: 8, strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Category-based Chart */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative">
                  <h3 className="text-lg font-semibold text-white mb-6">{translate('bieu_do_chi_tieu_danh_muc')}</h3>
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
                            <Cell 
                              key={`cell-${index}`} 
                              fill={[
                                '#34D399', // emerald-400
                                '#FB7185', // rose-400
                                '#60A5FA', // blue-400
                                '#A78BFA', // violet-400
                                '#F472B6', // pink-400
                                '#FBBF24', // amber-400
                                '#34D399'  // emerald-400 (fallback)
                              ][index % 7]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                            color: 'white'
                          }}
                          formatter={(value: any) => new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                            style: 'currency',
                            currency: language === 'vi' ? 'VND' : 'USD'
                          }).format(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg rounded-3xl p-6">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
              <div className="relative">
                <h3 className="text-lg font-semibold text-white mb-6">{translate('giao_dich_gan_day')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead>
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('ngay')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('loai')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('danh_muc')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('mo_ta')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('so_tien')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {summary.transactions.slice(0, 10).map((transaction, index) => (
                        <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {new Date(transaction.date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'Thu' 
                                ? 'bg-emerald-400/10 text-emerald-400' 
                                : 'bg-rose-400/10 text-rose-400'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {transaction.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              transaction.type === 'Thu' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                                style: 'currency',
                                currency: language === 'vi' ? 'VND' : 'USD'
                              }).format(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Orders Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Total Orders Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{translate('tong_so_don_hang')}</p>
                    <p className="text-2xl font-bold text-white mt-1 drop-shadow-lg">
                      {summary.totalOrders}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Order Value Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{translate('tong_gia_tri_don_hang')}</p>
                    <p className="text-2xl font-bold text-white mt-1 drop-shadow-lg">
                      {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: language === 'vi' ? 'VND' : 'USD'
                      }).format(summary.totalOrderValue)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Orders by Date Chart */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative">
                  <h3 className="text-lg font-semibold text-white mb-6">{translate('doanh_thu_thoi_gian')}</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ordersByDateData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                        <YAxis stroke="rgba(255,255,255,0.6)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                            color: 'white'
                          }}
                          formatter={(value: any) => new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                            style: 'currency',
                            currency: language === 'vi' ? 'VND' : 'USD'
                          }).format(Number(value))}
                          labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#34D399"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Orders by Status Chart */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg rounded-3xl p-6">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                <div className="relative">
                  <h3 className="text-lg font-semibold text-white mb-6">{translate('phan_tich_trang_thai')}</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ordersByStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {ordersByStatusData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.name === translate('hoan_thanh') ? '#34D399' : // emerald-400
                                entry.name === translate('dang_xu_ly') ? '#FBBF24' : // amber-400
                                entry.name === translate('cho_xu_ly') ? '#60A5FA' : // blue-400
                                entry.name === translate('da_huy') ? '#FB7185' : // rose-400
                                '#A78BFA' // violet-400 (fallback)
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                            color: 'white'
                          }}
                          formatter={(value: number) => [`${value} ${translate('don_hang_text')}`, translate('so_luong')]}
                        />
                        <Legend 
                          wrapperStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg rounded-3xl p-6">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
              <div className="relative">
                <h3 className="text-lg font-semibold text-white mb-6">{translate('don_hang_gan_day')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead>
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('ma_don')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('ngay_dat')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('tong_tien')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('trang_thai')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          {translate('thanh_toan')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {summary.orders.slice(0, 10).map((order) => (
                        <tr key={order.ma_don} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {order.ma_don}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {new Date(order.ngay_dat).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="text-emerald-400 font-medium">
                              {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                                style: 'currency',
                                currency: language === 'vi' ? 'VND' : 'USD'
                              }).format(order.tong_tien)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.trang_thai === 'Hoàn thành' ? 'bg-emerald-400/10 text-emerald-400' :
                              order.trang_thai === 'Đang xử lý' ? 'bg-amber-400/10 text-amber-400' :
                              order.trang_thai === 'Chờ xử lý' ? 'bg-blue-400/10 text-blue-400' :
                              'bg-rose-400/10 text-rose-400'
                            }`}>
                              {order.trang_thai}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.trang_thai_thanh_toan === 'Đã thanh toán' ? 'bg-emerald-400/10 text-emerald-400' :
                              'bg-amber-400/10 text-amber-400'
                            }`}>
                              {order.trang_thai_thanh_toan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-rose-400 border-l-transparent animate-spin"></div>
              <p className="text-white font-medium">{translate('dang_tai')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 bg-rose-400/10 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-white/10 backdrop-blur-xl text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                {translate('dong')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 