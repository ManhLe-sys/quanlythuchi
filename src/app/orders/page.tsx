"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import DateRangePicker from '../components/DateRangePicker';

interface MenuItem {
  ma_mon: string;
  ten_mon: string;
  ma_danh_muc: string;
  gia_ban: number;
  mo_ta: string;
  hinh_anh: string;
  trang_thai: string;
}

interface Category {
  ma_danh_muc: string;
  ten_danh_muc: string;
  ma_danh_muc_cha: string;
  mo_ta: string;
  trang_thai: string;
}

interface OrderItem {
  ma_mon: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

export default function OrdersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { translate, language } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [formData, setFormData] = useState({
    ten_khach: "",
    so_dien_thoai: "",
    dia_chi: "",
    ngay_dat: new Date().toISOString().split("T")[0],
    ngay_giao: "",
    phuong_thuc_thanh_toan: "",
    ghi_chu: "",
    trang_thai: "pending" as 'pending' | 'processing' | 'completed' | 'cancelled'
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Orders for current page
  const [paginatedOrders, setPaginatedOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, filterStatus, dateFilter]);
  
  // Update paginated orders whenever filtered orders or pagination settings change
  useEffect(() => {
    updatePaginatedOrders();
  }, [filteredOrders, currentPage, pageSize]);

  const updatePaginatedOrders = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
    
    // Calculate total pages
    setTotalPages(Math.max(1, Math.ceil(filteredOrders.length / pageSize)));
    
    // Reset to page 1 if current page is out of bounds
    if (currentPage > Math.ceil(filteredOrders.length / pageSize) && filteredOrders.length > 0) {
      setCurrentPage(1);
    }
  };

  const applyFilters = () => {
    let result = [...orders];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        order => 
          (order.ma_don && order.ma_don.toLowerCase().includes(term)) ||
          (order.ten_khach && order.ten_khach.toLowerCase().includes(term)) ||
          (order.so_dien_thoai && order.so_dien_thoai.includes(term))
      );
    }

    // Apply status filter - updated to handle "all" value
    if (filterStatus && filterStatus !== "all") {
      result = result.filter(order => order.trang_thai === filterStatus);
    }

    // Apply date range filter
    if (dateFilter.startDate) {
      const startDate = new Date(dateFilter.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(order => {
        const orderDate = new Date(order.ngay_dat);
        return orderDate >= startDate;
      });
    }

    if (dateFilter.endDate) {
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(order => {
        const orderDate = new Date(order.ngay_dat);
        return orderDate <= endDate;
      });
    }

    setFilteredOrders(result);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Lấy danh sách đơn hàng, menu items và categories
      const response = await fetch("/api/orders");
      const data = await response.json();
      console.log('Data từ API:', data); // Debug data từ API

      if (data.success) {
        // Set menu items và categories
        setMenuItems(data.data.menuItems || []);
        setCategories(data.data.categories || []);
        
        // Set danh sách đơn hàng
        const orders = data.data.orders?.map((order: any) => {
          console.log('Chi tiết đơn hàng gốc:', order); // Debug đơn hàng gốc

          // Kiểm tra và chuyển đổi dữ liệu chi tiết đơn hàng
          let danhSachMon = [];
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

          console.log('Danh sách món đã xử lý:', danhSachMon); // Debug danh sách món

          const processedOrder = {
            ...order,
            trang_thai_thanh_toan: order.trang_thai_thanh_toan || "Chưa thanh toán",
            danh_sach_mon: danhSachMon.map((item: any, index: number) => ({
              stt: index + 1,
              ma_mon: item.ma_mon,
              ten_mon: item.ten_mon,
              don_vi_tinh: item.don_vi_tinh || 'Cái',
              so_luong: item.so_luong,
              don_gia: item.don_gia,
              thanh_tien: item.thanh_tien,
              ghi_chu: item.ghi_chu || ''
            }))
          };

          console.log('Đơn hàng sau khi xử lý:', processedOrder); // Debug đơn hàng sau xử lý
          return processedOrder;
        }) || [];
        
        setOrders(orders);
        setFilteredOrders(orders);
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải dữ liệu",
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải dữ liệu",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem: OrderItem = {
      ma_mon: "",
      so_luong: 1,
      don_gia: 0,
      thanh_tien: 0,
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...selectedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    if (field === "ma_mon") {
      const selectedItem = menuItems.find((item) => item.ma_mon === value);
      if (selectedItem) {
        updatedItems[index].don_gia = selectedItem.gia_ban;
        updatedItems[index].thanh_tien = selectedItem.gia_ban * updatedItems[index].so_luong;
      }
    } else if (field === "so_luong") {
      updatedItems[index].thanh_tien = updatedItems[index].don_gia * value;
    }

    setSelectedItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Tính tổng tiền từ danh sách sản phẩm
      const tongTien = selectedItems.reduce((sum, item) => sum + item.thanh_tien, 0);
      const maDon = `DH${Date.now()}`;

      // Tạo danh sách món theo cấu trúc sheet
      const danhSachMon = selectedItems.map((item, index) => {
        const menuItem = menuItems.find(menu => menu.ma_mon === item.ma_mon);
        return {
          stt: index + 1,
          ma_mon: item.ma_mon,
          ten_mon: menuItem?.ten_mon || "",
          don_vi_tinh: "Cái",
          so_luong: item.so_luong,
          don_gia: item.don_gia,
          thanh_tien: item.thanh_tien,
          ghi_chu: ""
        };
      });
      
      // Xác định trạng thái đơn hàng dựa vào quyền người dùng
      const orderStatus = (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'staff') 
                        ? formData.trang_thai === 'pending' ? "Chờ xử lý" : formData.trang_thai === 'processing' ? "Đang xử lý" : formData.trang_thai === 'completed' ? "Hoàn thành" : formData.trang_thai === 'cancelled' ? "Đã hủy" : "Chờ xử lý"
                        : "Chờ xử lý"; // Khách hàng luôn tạo đơn với trạng thái "Chờ xử lý"

      // Tạo dữ liệu đơn hàng với danh_sach_mon
      const orderData = {
        ma_don: maDon,
        ngay_dat: formData.ngay_dat,
        ngay_giao: formData.ngay_giao,
        ten_khach: formData.ten_khach,
        so_dien_thoai: formData.so_dien_thoai,
        dia_chi: formData.dia_chi,
        tong_tien: tongTien,
        trang_thai: orderStatus,
        trang_thai_thanh_toan: formData.phuong_thuc_thanh_toan,
        phuong_thuc_thanh_toan: formData.phuong_thuc_thanh_toan,
        ghi_chu: formData.ghi_chu,
        id_nguoi_tao: user?.email || "GUEST",
        thoi_gian_tao: new Date().toISOString(),
        thoi_gian_cap_nhat: new Date().toISOString(),
        danh_sach_mon: danhSachMon
      };

      console.log('Dữ liệu gửi lên server:', orderData);

      // Gửi dữ liệu lên server
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Thành công",
          description: "Tạo đơn hàng thành công",
        });
        // Đóng modal và reset form
        setShowAddModal(false);
        resetOrderForm();
        // Refresh danh sách đơn hàng
        fetchData();
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: data.message || "Có lỗi xảy ra",
        });
      }
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo đơn hàng",
      });
    }
  };

  const handleOpenDetail = async (order: any) => {
    try {
      console.log('Chi tiết đơn hàng được chọn:', order);
      setIsDetailLoading(true);
      setSelectedOrder({...order}); // Set basic order info first
      setShowDetailModal(true);
      
      // Lấy chi tiết đơn hàng
      const response = await fetch(`/api/orders/${order.id}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedOrder({
          ...order,
          chi_tiet: data.data.orderDetails
        });
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể lấy chi tiết đơn hàng",
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lấy chi tiết đơn hàng",
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      "Chờ xử lý": "Đang xử lý",
      "Đang xử lý": "Đang giao hàng",
      "Đang giao hàng": "Hoàn thành",
      "Hoàn thành": "Hoàn thành"
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus;
  };

  const getNextPaymentStatus = (currentStatus: string) => {
    const statusFlow = {
      "Chưa thanh toán": "Đã thanh toán",
      "Đã thanh toán": "Đã thanh toán"
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus;
  };

  const handleStatusChange = async (newStatus: string, isPaymentStatus: boolean = false) => {
    try {
      if (!selectedOrder || !selectedOrder.ma_don) {
        throw new Error('Không tìm thấy thông tin đơn hàng');
      }

      const requestBody = isPaymentStatus 
        ? { trang_thai_thanh_toan: newStatus }
        : { trang_thai: newStatus };

      console.log('Cập nhật trạng thái:', {
        orderId: selectedOrder.ma_don,
        isPaymentStatus,
        newStatus,
        requestBody
      });

      const response = await fetch(`/api/orders/${selectedOrder.ma_don}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Phản hồi từ server:', data);

      if (data.success) {
        // Cập nhật state local
        const updatedOrder = {
          ...selectedOrder,
          [isPaymentStatus ? 'trang_thai_thanh_toan' : 'trang_thai']: newStatus
        };
        setSelectedOrder(updatedOrder);
        
        // Cập nhật danh sách đơn hàng
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.ma_don === selectedOrder.ma_don 
              ? updatedOrder 
              : order
          )
        );

        // Hiển thị thông báo thành công
        toast({
          title: "Thành công",
          description: `Đã cập nhật ${isPaymentStatus ? 'trạng thái thanh toán' : 'trạng thái đơn hàng'} thành "${newStatus}"`,
        });

        // Tải lại dữ liệu từ server
        await fetchData();
      } else {
        throw new Error(data.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật trạng thái",
      });
    }
  };

  // Helper function to check if user has permission to update order status
  const canUpdateOrderStatus = (): boolean => {
    if (!user) return false;
    const role = user.role?.toLowerCase() || '';
    return role === 'admin' || role === 'staff';
  };

  // Xử lý khi mở modal tạo đơn hàng mới
  const handleOpenAddModal = () => {
    // Reset form data với thông tin người dùng nếu đang đăng nhập
    if (user && user.role?.toLowerCase() === 'customer') {
      setFormData({
        ...formData,
        ten_khach: user.fullName || "",
        // Điền thêm thông tin khác nếu có (số điện thoại, địa chỉ)
      });
    } else {
      // Reset form cho admin/staff
      setFormData({
        ten_khach: "",
        so_dien_thoai: "",
        dia_chi: "",
        ngay_dat: new Date().toISOString().split("T")[0],
        ngay_giao: "",
        phuong_thuc_thanh_toan: "",
        ghi_chu: "",
        trang_thai: "pending"
      });
    }
    
    // Mở modal
    setShowAddModal(true);
  };

  // Xử lý đóng modal tạo đơn hàng
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedItems([]);
  };
  
  // Reset form sau khi tạo đơn hàng thành công
  const resetOrderForm = () => {
    setFormData({
      ten_khach: "",
      so_dien_thoai: "",
      dia_chi: "",
      ngay_dat: new Date().toISOString().split("T")[0],
      ngay_giao: "",
      phuong_thuc_thanh_toan: "",
      ghi_chu: "",
      trang_thai: "pending"
    });
    setSelectedItems([]);
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{translate('don_hang_title')}</h1>
            <p className="text-white/80">
              {translate('don_hang_desc')}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleOpenAddModal}
              className="px-6 py-2 rounded-xl font-medium bg-white text-gray-700 hover:bg-gray-50 shadow-lg transition-all duration-200 flex items-center gap-2 border border-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {translate('them_don_hang')}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <Label className="text-gray-700 font-medium mb-2 block">{translate('tim_kiem_don_hang')}</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder={translate('tim_kiem_don_hang')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700 pl-10"
            />
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div>
          <Label className="text-gray-700 font-medium mb-2 block">{translate('trang_thai_don_hang')}</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent bg-white text-gray-700">
              <SelectValue placeholder={translate('tat_ca_trang_thai')} className="text-gray-700" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 text-gray-700">
              <SelectItem value="all" className="text-gray-700">{translate('tat_ca_trang_thai')}</SelectItem>
              <SelectItem value="Chờ xử lý" className="text-gray-700">{translate('cho_xu_ly')}</SelectItem>
              <SelectItem value="Đang xử lý" className="text-gray-700">{translate('dang_xu_ly')}</SelectItem>
              <SelectItem value="Hoàn thành" className="text-gray-700">{translate('hoan_thanh')}</SelectItem>
              <SelectItem value="Đã hủy" className="text-gray-700">{translate('da_huy')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="lg:col-span-1 md:col-span-2">
          <Label className="text-gray-700 font-medium mb-2 block">{translate('ngay_dat_hang')}</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <div className="relative">
                <Input 
                  type="date" 
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700 w-full"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative">
                <Input 
                  type="date" 
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700 w-full"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#3E503C]/5 border-b border-[#3E503C]/10">
                <th className="font-medium text-gray-700 py-4 px-6 text-left">{translate('ma_don_hang')}</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-left">{translate('ten_khach_hang')}</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-left">{translate('ngay_dat_hang')}</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-right">{translate('tong_tien')}</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-center">{translate('trang_thai_don_hang')}</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-center">{translate('trang_thai_thanh_toan')}</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-right">{translate('thao_tac')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-[#3E503C] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600">{translate('dang_tai_du_lieu')}</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4 text-gray-500">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>{translate('khong_tim_thay_don_hang')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => (
                  <tr key={`${order.ma_don}-${index}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{order.ma_don}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{order.ten_khach}</div>
                      <div className="text-sm text-gray-600">{order.so_dien_thoai}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{new Date(order.ngay_dat).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(order.tong_tien)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          order.trang_thai === 'Hoàn thành'
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                            : order.trang_thai === 'Đang xử lý'
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10'
                            : order.trang_thai === 'Chờ xử lý'
                            ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                        }`}>
                          {order.trang_thai}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          order.trang_thai_thanh_toan === 'Đã thanh toán'
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                            : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/10'
                        }`}>
                          {order.trang_thai_thanh_toan}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 px-4 py-2 transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {translate('chi_tiet_don_hang')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              {translate('hien_thi')} {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredOrders.length)} {translate('cua')} {filteredOrders.length} {translate('don_hang')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber;
                
                // Always show current page
                if (totalPages <= 5) {
                  // If we have 5 or fewer pages, show all
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  // If current page is 1, 2, or 3, show pages 1-5
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // If current page is among the last 3, show the last 5 pages
                  pageNumber = totalPages - 4 + i;
                } else {
                  // Otherwise show current page and 2 pages on each side
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`rounded-xl px-4 py-2 transition-all text-gray-700 ${
                      currentPage === pageNumber
                        ? 'bg-[#3E503C]/10 border border-[#3E503C]/20 font-medium'
                        : 'bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
              
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[130px] rounded-xl bg-white text-gray-700 border border-gray-300">
                  <span className="flex items-center gap-2">
                    <span>{pageSize}</span>
                    <span className="text-gray-500">{translate('dong_mot_trang')}</span>
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="5" className="text-gray-700">5 {translate('dong_mot_trang')}</SelectItem>
                  <SelectItem value="10" className="text-gray-700">10 {translate('dong_mot_trang')}</SelectItem>
                  <SelectItem value="20" className="text-gray-700">20 {translate('dong_mot_trang')}</SelectItem>
                  <SelectItem value="50" className="text-gray-700">50 {translate('dong_mot_trang')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-700">{translate('chi_tiet_don_hang')} #{selectedOrder?.ma_don}</DialogTitle>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-[#3E503C] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">{translate('dang_tai_chi_tiet')}</p>
            </div>
          ) : (
            <div className="grid gap-6 py-6">
              {/* Customer and Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    {translate('thong_tin_khach_hang')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{selectedOrder?.ten_khach}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{selectedOrder?.so_dien_thoai}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-700">
                      <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{selectedOrder?.dia_chi}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    {translate('thong_tin_don_hang')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{translate('ngay_dat')} {new Date(selectedOrder?.ngay_dat).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{translate('ngay_giao')} {selectedOrder?.ngay_giao ? new Date(selectedOrder.ngay_giao).toLocaleDateString('vi-VN') : 'Chưa xác định'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>{translate('phuong_thuc_thanh_toan_label')} {selectedOrder?.phuong_thuc_thanh_toan}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  {translate('danh_sach_mon')}
                </h3>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#3E503C]/5 border-b border-[#3E503C]/10">
                        <th className="font-medium text-[#3E503C] py-4 px-6 text-left">STT</th>
                        <th className="font-medium text-[#3E503C] py-4 px-6 text-left">Tên món</th>
                        <th className="font-medium text-[#3E503C] py-4 px-6 text-center">Số lượng</th>
                        <th className="font-medium text-[#3E503C] py-4 px-6 text-right">Đơn giá</th>
                        <th className="font-medium text-[#3E503C] py-4 px-6 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder?.chi_tiet?.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-[#3E503C]/5 transition-colors">
                          <td className="py-4 px-6 text-[#3E503C]">{item.stt}</td>
                          <td className="py-4 px-6 text-[#3E503C] font-medium">{item.ten_mon}</td>
                          <td className="py-4 px-6 text-center text-[#3E503C]">{item.so_luong}</td>
                          <td className="py-4 px-6 text-right text-[#3E503C]">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.don_gia)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-[#3E503C]">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.thanh_tien)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-[#3E503C]/5">
                        <td colSpan={4} className="py-4 px-6 text-right font-medium text-[#3E503C]">Tổng cộng:</td>
                        <td className="py-4 px-6 text-right font-bold text-[#3E503C]">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(selectedOrder?.tong_tien)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    {translate('trang_thai_don_hang')}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${
                      selectedOrder?.trang_thai === 'Hoàn thành'
                        ? 'bg-[#3E503C]/10 text-[#3E503C] ring-1 ring-[#3E503C]/20'
                        : selectedOrder?.trang_thai === 'Đang xử lý'
                        ? 'bg-[#7F886A]/10 text-[#7F886A] ring-1 ring-[#7F886A]/20'
                        : selectedOrder?.trang_thai === 'Chờ xử lý'
                        ? 'bg-[#FF6F3D]/10 text-[#FF6F3D] ring-1 ring-[#FF6F3D]/20'
                        : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                    }`}>
                      {selectedOrder?.trang_thai}
                    </span>
                    {canUpdateOrderStatus() && (
                      <Button
                        onClick={() => handleStatusChange(getNextStatus(selectedOrder?.trang_thai))}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-[#7F886A]/10 text-gray-700 border border-gray-200 transition-all"
                      >
                        {translate('cap_nhat_trang_thai')}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    {translate('trang_thai_thanh_toan')}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${
                      selectedOrder?.trang_thai_thanh_toan === 'Đã thanh toán'
                        ? 'bg-[#3E503C]/10 text-[#3E503C] ring-1 ring-[#3E503C]/20'
                        : 'bg-[#FF6F3D]/10 text-[#FF6F3D] ring-1 ring-[#FF6F3D]/20'
                    }`}>
                      {selectedOrder?.trang_thai_thanh_toan}
                    </span>
                    {canUpdateOrderStatus() && selectedOrder?.trang_thai_thanh_toan !== 'Đã thanh toán' && (
                      <Button
                        onClick={() => handleStatusChange(getNextPaymentStatus(selectedOrder?.trang_thai_thanh_toan), true)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-[#7F886A]/10 text-gray-700 border border-gray-200 transition-all"
                      >
                        {translate('thanh_toan')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder?.ghi_chu && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    {translate('ghi_chu')}
                  </h3>
                  <p className="text-gray-700 bg-[#3E503C]/5 p-4 rounded-xl">{selectedOrder.ghi_chu}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowDetailModal(false)}
              className="px-6 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-[#3E503C]/20 hover:border-[#3E503C]/30 transition-all"
            >
              {translate('dong')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Order Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-700">{translate('them_don_hang')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            {/* Customer Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b border-[#3E503C]/10 pb-2">{translate('thong_tin_khach_hang')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-gray-700 font-medium">{translate('ten_khach_hang')}</Label>
                  <Input
                    id="customerName"
                    value={formData.ten_khach}
                    onChange={(e) => setFormData({ ...formData, ten_khach: e.target.value })}
                    className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700 placeholder:text-gray-500"
                    placeholder={translate('ten_khach_hang')}
                    disabled={user?.role?.toLowerCase() === 'customer'}
                    readOnly={user?.role?.toLowerCase() === 'customer'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-gray-700 font-medium">{translate('so_dien_thoai')}</Label>
                  <Input
                    id="customerPhone"
                    value={formData.so_dien_thoai}
                    onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                    className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700 placeholder:text-gray-500"
                    placeholder={translate('so_dien_thoai')}
                  />
                </div>
              </div>
            </div>

            {/* Order Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-[#3E503C]/10 pb-2">{translate('danh_sach_mon')}</h3>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#7F886A]/10 text-gray-700 border border-gray-200 transition-all shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  {translate('them_mon')}
                </Button>
              </div>
              <div className="space-y-4">
                {selectedItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className="md:col-span-5 space-y-2">
                      <Label className="text-gray-700 font-medium">{translate('san_pham')}</Label>
                      <Select value={item.ma_mon} onValueChange={(value) => handleItemChange(index, 'ma_mon', value)}>
                        <SelectTrigger className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700 bg-white">
                          <SelectValue placeholder={translate('san_pham')} className="text-gray-500" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-md">
                          {menuItems.map((menuItem) => (
                            <SelectItem key={menuItem.ma_mon} value={menuItem.ma_mon} className="text-gray-700 hover:bg-[#3E503C]/10">
                              {menuItem.ten_mon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-gray-700 font-medium">{translate('so_luong')}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.so_luong}
                        onChange={(e) => handleItemChange(index, 'so_luong', parseInt(e.target.value))}
                        className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-gray-700 font-medium">{translate('don_gia')}</Label>
                      <Input
                        type="number"
                        value={item.don_gia}
                        onChange={(e) => handleItemChange(index, 'don_gia', parseInt(e.target.value))}
                        className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 rounded-xl bg-white hover:bg-[#FF6F3D]/10 text-[#FF6F3D] border border-[#FF6F3D]/20 hover:border-[#FF6F3D]/30 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Section */}
            <div className="space-y-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 border-b border-[#3E503C]/10 pb-2">{translate('tong_tien')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">{translate('tong_tien')}</Label>
                  <div className="text-2xl font-bold text-gray-700">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(selectedItems.reduce((sum, item) => sum + item.don_gia * item.so_luong, 0))}
                  </div>
                </div>
                {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'staff') && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">{translate('trang_thai_don_hang')}</Label>
                    <Select value={formData.trang_thai} onValueChange={(value: 'pending' | 'processing' | 'completed' | 'cancelled') => setFormData({ ...formData, trang_thai: value })}>
                      <SelectTrigger className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent text-gray-700 bg-white">
                        <SelectValue placeholder={translate('trang_thai_don_hang')} className="text-gray-500" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-md">
                        <SelectItem value="pending" className="text-gray-700 hover:bg-[#3E503C]/10">{translate('cho_xu_ly')}</SelectItem>
                        <SelectItem value="processing" className="text-gray-700 hover:bg-[#3E503C]/10">{translate('dang_xu_ly')}</SelectItem>
                        <SelectItem value="completed" className="text-gray-700 hover:bg-[#3E503C]/10">{translate('hoan_thanh')}</SelectItem>
                        <SelectItem value="cancelled" className="text-gray-700 hover:bg-[#3E503C]/10">{translate('da_huy')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              onClick={handleCloseAddModal}
              className="px-6 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-[#3E503C]/20 hover:border-[#3E503C]/30 transition-all"
            >
              {translate('dong')}
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-white hover:bg-[#7F886A]/10 text-gray-700 border border-gray-200 transition-all shadow-lg"
            >
              {translate('them_don_hang')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 