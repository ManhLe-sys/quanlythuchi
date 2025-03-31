"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    ten_khach: "",
    so_dien_thoai: "",
    dia_chi: "",
    ngay_dat: new Date().toISOString().split("T")[0],
    ngay_giao: "",
    phuong_thuc_thanh_toan: "",
    ghi_chu: "",
  });
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

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

      // Tạo dữ liệu đơn hàng với danh_sach_mon
      const orderData = {
        ma_don: maDon,
        ngay_dat: formData.ngay_dat,
        ngay_giao: formData.ngay_giao,
        ten_khach: formData.ten_khach,
        so_dien_thoai: formData.so_dien_thoai,
        dia_chi: formData.dia_chi,
        tong_tien: tongTien,
        trang_thai: "Chờ xử lý",
        trang_thai_thanh_toan: formData.phuong_thuc_thanh_toan,
        phuong_thuc_thanh_toan: formData.phuong_thuc_thanh_toan,
        ghi_chu: formData.ghi_chu,
        id_nguoi_tao: "ADMIN",
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
        setShowAddModal(false);
        // Reset form
        setFormData({
          ten_khach: "",
          so_dien_thoai: "",
          dia_chi: "",
          ngay_dat: new Date().toISOString().split("T")[0],
          ngay_giao: "",
          phuong_thuc_thanh_toan: "",
          ghi_chu: "",
        });
        setSelectedItems([]);
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
      
      // Lấy chi tiết đơn hàng
      const response = await fetch(`/api/orders/${order.id}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedOrder({
          ...order,
          chi_tiet: data.data.orderDetails
        });
        setShowDetailModal(true);
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

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Quản Lý Đơn Hàng</h1>
            <p className="text-white/80">
              Quản lý đơn hàng và theo dõi doanh thu
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 rounded-xl font-medium bg-white text-blue-600 hover:bg-white/90 shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tạo Đơn Hàng Mới
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn hàng..."
                  className="pl-10 pr-4 py-2 w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-4">
                <input
                  type="date"
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
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
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="font-medium text-gray-700 py-4 px-6 text-left">Mã đơn</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-left">Khách hàng</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-left">Ngày đặt</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-right">Tổng tiền</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-center">Trạng thái</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-center">Thanh toán</th>
                <th className="font-medium text-gray-700 py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4 text-gray-500">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>Chưa có đơn hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.ma_don} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
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
                          className="rounded-xl bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-300 px-4 py-2 transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng #{selectedOrder.ma_don}</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Thông tin khách hàng</h3>
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Tên khách hàng:</span> {selectedOrder.ten_khach}</p>
                    <p><span className="text-gray-600">Số điện thoại:</span> {selectedOrder.so_dien_thoai}</p>
                    <p><span className="text-gray-600">Địa chỉ:</span> {selectedOrder.dia_chi}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Thông tin đơn hàng</h3>
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Ngày đặt:</span> {new Date(selectedOrder.ngay_dat).toLocaleDateString('vi-VN')}</p>
                    <p><span className="text-gray-600">Ngày giao:</span> {selectedOrder.ngay_giao ? new Date(selectedOrder.ngay_giao).toLocaleDateString('vi-VN') : 'Chưa xác định'}</p>
                    <p><span className="text-gray-600">Phương thức thanh toán:</span> {selectedOrder.phuong_thuc_thanh_toan}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-4">Danh sách món</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="font-medium text-gray-700 py-2 px-4 text-left">STT</th>
                        <th className="font-medium text-gray-700 py-2 px-4 text-left">Tên món</th>
                        <th className="font-medium text-gray-700 py-2 px-4 text-center">Số lượng</th>
                        <th className="font-medium text-gray-700 py-2 px-4 text-right">Đơn giá</th>
                        <th className="font-medium text-gray-700 py-2 px-4 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.chi_tiet.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-50">
                          <td className="py-2 px-4">{item.stt}</td>
                          <td className="py-2 px-4">{item.ten_mon}</td>
                          <td className="py-2 px-4 text-center">{item.so_luong}</td>
                          <td className="py-2 px-4 text-right">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.don_gia)}
                          </td>
                          <td className="py-2 px-4 text-right">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.thanh_tien)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50/50">
                        <td colSpan={4} className="py-2 px-4 text-right font-medium">Tổng cộng:</td>
                        <td className="py-2 px-4 text-right font-medium">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(selectedOrder.tong_tien)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-700 mb-2">Trạng thái đơn hàng</h3>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.trang_thai === 'Hoàn thành'
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                        : selectedOrder.trang_thai === 'Đang xử lý'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10'
                        : selectedOrder.trang_thai === 'Chờ xử lý'
                        ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10'
                        : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                    }`}>
                      {selectedOrder.trang_thai}
                    </span>
                    <button
                      onClick={() => handleStatusChange(getNextStatus(selectedOrder.trang_thai))}
                      className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-lg"
                    >
                      Cập nhật trạng thái
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-medium text-gray-700 mb-2">Trạng thái thanh toán</h3>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.trang_thai_thanh_toan === 'Đã thanh toán'
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                        : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/10'
                    }`}>
                      {selectedOrder.trang_thai_thanh_toan}
                    </span>
                    <button
                      onClick={() => handleStatusChange(getNextPaymentStatus(selectedOrder.trang_thai_thanh_toan), true)}
                      className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all shadow-lg"
                    >
                      Cập nhật thanh toán
                    </button>
                  </div>
                </div>
              </div>

              {selectedOrder.ghi_chu && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-700 mb-2">Ghi chú</h3>
                  <p className="text-gray-600">{selectedOrder.ghi_chu}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Tạo đơn hàng mới</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">Tên khách hàng</label>
                  <input
                    type="text"
                    value={formData.ten_khach}
                    onChange={(e) => setFormData({ ...formData, ten_khach: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.so_dien_thoai}
                    onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">Ngày đặt</label>
                  <input
                    type="date"
                    value={formData.ngay_dat}
                    onChange={(e) => setFormData({ ...formData, ngay_dat: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">Ngày giao</label>
                  <input
                    type="date"
                    value={formData.ngay_giao}
                    onChange={(e) => setFormData({ ...formData, ngay_giao: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-gray-700 font-medium">Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.dia_chi}
                    onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-gray-700 font-medium">Phương thức thanh toán</label>
                  <select
                    value={formData.phuong_thuc_thanh_toan}
                    onChange={(e) => setFormData({ ...formData, phuong_thuc_thanh_toan: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn phương thức thanh toán</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-gray-700 font-medium">Ghi chú</label>
                  <textarea
                    value={formData.ghi_chu}
                    onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  ></textarea>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Danh sách món</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm món
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-1">
                        <select
                          value={item.ma_mon}
                          onChange={(e) => handleItemChange(index, "ma_mon", e.target.value)}
                          className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Chọn món</option>
                          {menuItems.map((menuItem) => (
                            <option key={menuItem.ma_mon} value={menuItem.ma_mon}>
                              {menuItem.ten_mon}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={item.so_luong}
                          onChange={(e) => handleItemChange(index, "so_luong", parseInt(e.target.value))}
                          className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.don_gia}
                          readOnly
                          className="w-full rounded-xl bg-gray-50 border-gray-200"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.thanh_tien}
                          readOnly
                          className="w-full rounded-xl bg-gray-50 border-gray-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-lg"
                >
                  Tạo đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 