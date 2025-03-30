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

  const handleStatusChange = async (newStatus: string) => {
    try {
      // Gửi request cập nhật trạng thái lên server
      const response = await fetch(`/api/orders/${selectedOrder.ma_don}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trang_thai: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Cập nhật trạng thái trong state
        setSelectedOrder({
          ...selectedOrder,
          trang_thai: newStatus
        });
        
        // Cập nhật trạng thái trong danh sách đơn hàng
        setOrders(orders.map(order => 
          order.ma_don === selectedOrder.ma_don 
            ? { ...order, trang_thai: newStatus }
            : order
        ));
        
        toast({
          title: "Thành công",
          description: `Đã cập nhật trạng thái thành "${newStatus}"`,
        });
      } else {
        throw new Error(data.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật trạng thái",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold gradient-text">Quản Lý Đơn Hàng</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tạo Đơn Hàng Mới
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-3xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Từ ngày</label>
            <input
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Đến ngày</label>
            <input
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Trạng thái</label>
            <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Tất cả</option>
              <option value="cho_xu_ly">Chờ xử lý</option>
              <option value="dang_xu_ly">Đang xử lý</option>
              <option value="dang_giao_hang">Đang giao hàng</option>
              <option value="hoan_thanh">Hoàn thành</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Khách hàng</label>
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium">Mã đơn</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Ngày đặt</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Khách hàng</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Sản phẩm</th>
                <th className="px-6 py-4 text-right text-sm font-medium">Tổng tiền</th>
                <th className="px-6 py-4 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-6 py-4 text-center text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order: any) => (
                <tr 
                  key={order.ma_don} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleOpenDetail(order)}
                >
                  <td className="px-6 py-4 text-sm">{order.ma_don}</td>
                  <td className="px-6 py-4 text-sm">{new Date(order.ngay_dat).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 text-sm">{order.ten_khach}</td>
                  <td className="px-6 py-4 text-sm">
                    {order.danh_sach_mon.map((item: any) => 
                      `${item.ten_mon} (x${item.so_luong})`
                    ).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">{order.tong_tien.toLocaleString()}đ</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                      {order.trang_thai}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl text-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">Chi Tiết Đơn Hàng</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Thông Tin Đơn Hàng</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Mã đơn:</span>
                      <span>{selectedOrder.ma_don}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Ngày đặt:</span>
                      <span>{selectedOrder.ngay_dat}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Trạng thái:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-sm font-medium rounded-lg ${
                          selectedOrder.trang_thai === "Chờ xử lý" ? "bg-yellow-100 text-yellow-800" :
                          selectedOrder.trang_thai === "Đang xử lý" ? "bg-blue-100 text-blue-800" :
                          selectedOrder.trang_thai === "Đang giao hàng" ? "bg-purple-100 text-purple-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {selectedOrder.trang_thai}
                        </span>
                        {selectedOrder.trang_thai !== "Hoàn thành" && (
                          <button
                            onClick={() => handleStatusChange(getNextStatus(selectedOrder.trang_thai))}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Chuyển trạng thái tiếp theo"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phương thức thanh toán:</span>
                      <span>{selectedOrder.phuong_thuc_thanh_toan}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Thông Tin Khách Hàng</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Tên khách hàng:</span>
                      <span>{selectedOrder.ten_khach}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Số điện thoại:</span>
                      <span>{selectedOrder.so_dien_thoai}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Địa chỉ:</span>
                      <span className="text-right">{selectedOrder.dia_chi}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Danh Sách Sản Phẩm</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-medium">STT</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Mã sản phẩm</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Tên sản phẩm</th>
                        <th className="px-4 py-2 text-center text-sm font-medium">Đơn vị tính</th>
                        <th className="px-4 py-2 text-center text-sm font-medium">Số lượng</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">Đơn giá</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">Thành tiền</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.chi_tiet.map((item: any) => (
                        <tr key={item.stt}>
                          <td className="px-4 py-3 text-sm">{item.stt}</td>
                          <td className="px-4 py-3 text-sm">{item.ma_mon}</td>
                          <td className="px-4 py-3 text-sm">{item.ten_mon}</td>
                          <td className="px-4 py-3 text-sm text-center">{item.don_vi_tinh}</td>
                          <td className="px-4 py-3 text-sm text-center">{item.so_luong}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.don_gia.toLocaleString()}đ</td>
                          <td className="px-4 py-3 text-sm text-right">{item.thanh_tien.toLocaleString()}đ</td>
                          <td className="px-4 py-3 text-sm">{item.ghi_chu || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={6} className="px-4 py-3 text-right font-medium">Tổng tiền:</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                          {selectedOrder.tong_tien.toLocaleString()}đ
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.ghi_chu && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Ghi Chú</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm">{selectedOrder.ghi_chu}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                {selectedOrder.trang_thai !== "Hoàn thành" && (
                  <button
                    onClick={() => handleStatusChange(getNextStatus(selectedOrder.trang_thai))}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span>Chuyển sang {getNextStatus(selectedOrder.trang_thai)}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl text-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">Tạo Đơn Hàng Mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Khách hàng</label>
                  <input
                    type="text"
                    value={formData.ten_khach}
                    onChange={(e) => setFormData({ ...formData, ten_khach: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.so_dien_thoai}
                    onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Địa chỉ</label>
                  <textarea
                    value={formData.dia_chi}
                    onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày đặt</label>
                  <input
                    type="date"
                    value={formData.ngay_dat}
                    onChange={(e) => setFormData({ ...formData, ngay_dat: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày giao</label>
                  <input
                    type="date"
                    value={formData.ngay_giao}
                    onChange={(e) => setFormData({ ...formData, ngay_giao: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phương thức thanh toán</label>
                  <select
                    value={formData.phuong_thuc_thanh_toan}
                    onChange={(e) => setFormData({ ...formData, phuong_thuc_thanh_toan: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn phương thức thanh toán</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Momo">Ví Momo</option>
                    <option value="ZaloPay">ZaloPay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ghi chú</label>
                  <textarea
                    value={formData.ghi_chu}
                    onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  ></textarea>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Sản phẩm</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Thêm sản phẩm
                  </button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto p-4 bg-gray-50 rounded-xl">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm">
                      <select
                        value={item.ma_mon}
                        onChange={(e) => handleItemChange(index, "ma_mon", e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Chọn sản phẩm</option>
                        {menuItems.map((menuItem) => (
                          <option key={menuItem.ma_mon} value={menuItem.ma_mon}>
                            {menuItem.ten_mon} - {menuItem.gia_ban.toLocaleString()}đ
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.so_luong}
                        onChange={(e) => handleItemChange(index, "so_luong", parseInt(e.target.value))}
                        min="1"
                        className="w-24 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <div className="w-32 px-4 py-2 text-right">
                        {item.thanh_tien.toLocaleString()}đ
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {selectedItems.length > 0 && (
                  <div className="flex justify-end items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium">Tổng tiền:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {selectedItems.reduce((sum, item) => sum + item.thanh_tien, 0).toLocaleString()}đ
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 