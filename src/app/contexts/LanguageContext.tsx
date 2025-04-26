"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define available languages
export type Language = 'vi' | 'en';

// Language context type
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
};

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  translate: () => '',
});

// Hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Dictionary of translations
const translations: Record<Language, Record<string, string>> = {
  vi: {
    // App name
    'app_name': 'Quản Lý Thu Chi',
    
    // Header navigation
    'thu_chi': 'Thu Chi',
    'giao_dich': 'Giao Dịch',
    'bao_cao': 'Báo Cáo',
    'san_pham': 'Sản Phẩm',
    'don_hang': 'Đơn Hàng',
    'quan_ly': 'Quản Lý',
    
    // User menu
    'dang_nhap': 'Đăng Nhập',
    'dang_xuat': 'Đăng Xuất',
    'vai_tro': 'Vai trò',
    'nguoi_dung': 'Người dùng',
    
    // Admin page
    'quan_ly_he_thong': 'Quản Lý Hệ Thống',
    'quan_ly_nguoi_dung': 'Quản Lý Người Dùng',
    'quan_ly_thuc_don': 'Quản Lý Thực Đơn',
    'them_nguoi_dung': 'Thêm Người Dùng',
    'tim_kiem_nguoi_dung': 'Tìm kiếm người dùng...',
    'them_mon_an': 'Thêm Món Ăn',
    'tim_kiem_mon_an': 'Tìm kiếm món ăn...',
    'ten_day_du': 'Tên đầy đủ',
    'email': 'Email',
    'vai_tro_user': 'Vai trò',
    'trang_thai': 'Trạng thái',
    'hoat_dong': 'Hoạt động',
    'khong_hoat_dong': 'Không hoạt động',
    'loc_theo_vai_tro': 'Lọc theo vai trò',
    'admin_role': 'Quản trị viên',
    'nhan_vien': 'Nhân viên',
    'khach_hang_role': 'Khách hàng',
    'doi_mat_khau': 'Đổi mật khẩu',
    'doi_vai_tro': 'Đổi vai trò',
    'xoa_nguoi_dung': 'Xóa người dùng',
    'xac_nhan_xoa': 'Xác nhận xóa',
    'ban_co_chac_xoa': 'Bạn có chắc muốn xóa người dùng này không?',
    'hanh_dong_khong_hoan_tac': 'Hành động này không thể hoàn tác.',
    'huy_bo': 'Hủy bỏ',
    'xoa': 'Xóa',
    'mat_khau_moi': 'Mật khẩu mới',
    'xac_nhan_mat_khau': 'Xác nhận mật khẩu',
    'cap_nhat': 'Cập nhật',
    'ten_mon': 'Tên món',
    'gia': 'Giá',
    'hinh_anh': 'Hình ảnh',
    'chinh_sua': 'Chỉnh sửa',
    'luu': 'Lưu',
    'trang': 'Trang',
    'trang_truoc': 'Trang trước',
    'trang_sau': 'Trang sau',
    'so_luong_ton': 'Số lượng tồn',
    'thong_tin_nguoi_dung': 'Thông tin người dùng',
    'thong_tin_mon_an': 'Thông tin món ăn',
    'cap_nhat_thanh_cong': 'Cập nhật thành công',
    'da_xay_ra_loi': 'Đã xảy ra lỗi',
    'vui_long_thu_lai': 'Vui lòng thử lại sau',
    
    // Thu Chi page
    'quan_ly_thu_chi': 'Quản Lý Thu Chi',
    'theo_doi_thu_chi': 'Theo dõi và quản lý thu chi của bạn một cách hiệu quả',
    'ngay': 'Ngày',
    'tuan': 'Tuần',
    'thang': 'Tháng',
    'tong_thu': 'Tổng Thu',
    'tong_chi': 'Tổng Chi',
    'so_du': 'Số Dư',
    'them_khoan_thu': 'Thêm Khoản Thu',
    'them_thu_nhap': 'Thêm thu nhập, tiền lương, thưởng, v.v.',
    'them_khoan_chi': 'Thêm Khoản Chi',
    'them_chi_tieu': 'Thêm chi tiêu, hóa đơn, mua sắm, v.v.',
    'giao_dich_gan_day': 'Giao Dịch Gần Đây',
    
    // Transactions page
    'lich_su_giao_dich': 'Lịch Sử Giao Dịch',
    'xem_quan_ly_giao_dich': 'Xem và quản lý tất cả các giao dịch thu chi của bạn',
    'them_thu_nhap_btn': 'Thêm Thu Nhập',
    'them_chi_tieu_btn': 'Thêm Chi Tiêu',
    'loai': 'Loại',
    'tat_ca': 'Tất cả',
    'thu_nhap': 'Thu nhập',
    'chi_tieu': 'Chi tiêu',
    'nguoi_ghi': 'Người ghi',
    'danh_muc': 'Danh mục',
    'mo_ta': 'Mô tả',
    'so_tien': 'Số tiền',
    'thao_tac': 'Thao tác',
    'dang_tai_du_lieu': 'Đang tải dữ liệu giao dịch...',
    'chua_co_giao_dich': 'Chưa có giao dịch nào',
    
    // Reports page
    'nam': 'Năm',
    'bao_cao_thu_chi': 'Báo Cáo Thu Chi',
    'bao_cao_don_hang': 'Báo Cáo Đơn Hàng',
    'tong_thu_nhap': 'Tổng Thu Nhập',
    'tong_chi_tieu': 'Tổng Chi Tiêu',
    'bieu_do_thu_chi_thoi_gian': 'Biểu Đồ Thu Chi Theo Thời Gian',
    'bieu_do_chi_tieu_danh_muc': 'Biểu Đồ Chi Tiêu Theo Danh Mục',
    'tong_so_don_hang': 'Tổng Số Đơn Hàng',
    'tong_gia_tri_don_hang': 'Tổng Giá Trị Đơn Hàng',
    'doanh_thu_thoi_gian': 'Doanh Thu Theo Thời Gian',
    'phan_tich_trang_thai': 'Phân Tích Theo Trạng Thái Đơn Hàng',
    'hoan_thanh': 'Hoàn thành',
    'dang_xu_ly': 'Đang xử lý',
    'cho_xu_ly': 'Chờ xử lý',
    'da_huy': 'Đã hủy',
    'don_hang_text': 'đơn hàng',
    'so_luong': 'Số lượng',
    
    // Products page
    'loi_tai_du_lieu': 'Có lỗi xảy ra khi tải dữ liệu',
    'khong_co_du_lieu_san_pham': 'Không có dữ liệu sản phẩm',
    'khong_the_tai_ds_sp': 'Không thể tải danh sách sản phẩm',
    'loi': 'Lỗi',
    'tim_kiem': 'Tìm kiếm sản phẩm',
    'san_pham_desc': 'Khám phá danh sách sản phẩm của chúng tôi',
    'gio_hang': 'Giỏ Hàng',
    'gio_hang_trong': 'Giỏ hàng của bạn đang trống',
    'tiep_tuc_mua_hang': 'Tiếp tục mua hàng',
    'con_lai': 'Còn lại',
    'chi_con_1': 'Chỉ còn 1 có sẵn',
    'co_san': 'có sẵn',
    'tong_cong': 'Tổng cộng',
    'thanh_toan': 'Thanh toán',
    'khong_tim_thay_sp': 'Không tìm thấy sản phẩm nào',
    'thu_tim_kiem_khac': 'Thử tìm kiếm với từ khóa khác hoặc xem tất cả sản phẩm',
    'xem_tat_ca_sp': 'Xem tất cả sản phẩm',
    'sp_ko_san_sang': 'Sản phẩm không có sẵn',
    'het_hang': 'Hết hàng',
    'them_vao_gio': 'Thêm vào giỏ hàng',
    'mua_ngay': 'Mua ngay',

    // Orders page
    'don_hang_title': 'Đơn Hàng',
    'don_hang_desc': 'Xem và quản lý tất cả đơn hàng của bạn',
    'them_don_hang': 'Thêm Đơn Hàng',
    'tim_kiem_don_hang': 'Tìm kiếm đơn hàng...',
    'ngay_dat_hang': 'Ngày đặt hàng',
    'ma_don_hang': 'Mã đơn hàng',
    'ten_khach_hang': 'Tên khách hàng',
    'trang_thai_don_hang': 'Trạng thái đơn hàng',
    'trang_thai_thanh_toan': 'Trạng thái thanh toán',
    'tat_ca_trang_thai': 'Tất cả trạng thái',
    'chi_tiet_don_hang': 'Chi tiết đơn hàng',
    'cap_nhat_trang_thai': 'Cập nhật trạng thái',
    'thong_tin_khach_hang': 'Thông tin khách hàng',
    'thong_tin_don_hang': 'Thông tin đơn hàng',
    'danh_sach_mon': 'Danh sách món',
    'san_pham_trong_don': 'Sản phẩm trong đơn',
    'tong_tien': 'Tổng tiền',
    'chua_thanh_toan': 'Chưa thanh toán',
    'da_thanh_toan': 'Đã thanh toán',
    'dang_xu_ly_thanh_toan': 'Đang xử lý thanh toán',
    'ngay_dat': 'Ngày đặt:',
    'ngay_giao': 'Ngày giao:',
    'phuong_thuc_thanh_toan_label': 'Phương thức thanh toán:',
    'ghi_chu': 'Ghi chú',
    'dong': 'Đóng',
    'khong_tim_thay_don_hang': 'Không tìm thấy đơn hàng nào',
    'so_dien_thoai': 'Số điện thoại',
    'dia_chi': 'Địa chỉ',
    'tao_don_hang': 'Tạo đơn hàng',
    'tong_ket_don_hang': 'Tổng kết đơn hàng',
    'them_mon': 'Thêm món',
    'don_gia': 'Đơn giá',
    'huy': 'Hủy',
  },
  en: {
    // App name
    'app_name': 'Finance Manager',
    
    // Header navigation
    'thu_chi': 'Income/Expense',
    'giao_dich': 'Transactions',
    'bao_cao': 'Reports',
    'san_pham': 'Products',
    'don_hang': 'Orders',
    'quan_ly': 'Admin',
    
    // User menu
    'dang_nhap': 'Login',
    'dang_xuat': 'Logout',
    'vai_tro': 'Role',
    'nguoi_dung': 'User',
    
    // Admin page
    'quan_ly_he_thong': 'System Management',
    'quan_ly_nguoi_dung': 'User Management',
    'quan_ly_thuc_don': 'Menu Management',
    'them_nguoi_dung': 'Add User',
    'tim_kiem_nguoi_dung': 'Search users...',
    'them_mon_an': 'Add Item',
    'tim_kiem_mon_an': 'Search item...',
    'ten_day_du': 'Full Name',
    'email': 'Email',
    'vai_tro_user': 'Role',
    'trang_thai': 'Status',
    'hoat_dong': 'Active',
    'khong_hoat_dong': 'Inactive',
    'loc_theo_vai_tro': 'Filter by role',
    'admin_role': 'Administrator',
    'nhan_vien': 'Staff',
    'khach_hang_role': 'Customer',
    'doi_mat_khau': 'Change Password',
    'doi_vai_tro': 'Change Role',
    'xoa_nguoi_dung': 'Delete User',
    'xac_nhan_xoa': 'Confirm Delete',
    'ban_co_chac_xoa': 'Are you sure you want to delete this user?',
    'hanh_dong_khong_hoan_tac': 'This action cannot be undone.',
    'huy_bo': 'Cancel',
    'xoa': 'Delete',
    'mat_khau_moi': 'New Password',
    'xac_nhan_mat_khau': 'Confirm Password',
    'cap_nhat': 'Update',
    'ten_mon': 'Item Name',
    'gia': 'Price',
    'hinh_anh': 'Image',
    'chinh_sua': 'Edit',
    'luu': 'Save',
    'trang': 'Page',
    'trang_truoc': 'Previous Page',
    'trang_sau': 'Next Page',
    'so_luong_ton': 'Stock Quantity',
    'thong_tin_nguoi_dung': 'User Information',
    'thong_tin_mon_an': 'Item Information',
    'cap_nhat_thanh_cong': 'Update Successful',
    'da_xay_ra_loi': 'An error occurred',
    'vui_long_thu_lai': 'Please try again later',
    
    // Thu Chi page
    'quan_ly_thu_chi': 'Income & Expense Management',
    'theo_doi_thu_chi': 'Track and manage your finances effectively',
    'ngay': 'Day',
    'tuan': 'Week',
    'thang': 'Month',
    'tong_thu': 'Total Income',
    'tong_chi': 'Total Expense',
    'so_du': 'Balance',
    'them_khoan_thu': 'Add Income',
    'them_thu_nhap': 'Add salary, bonus, revenue, etc.',
    'them_khoan_chi': 'Add Expense',
    'them_chi_tieu': 'Add spending, bills, shopping, etc.',
    'giao_dich_gan_day': 'Recent Transactions',
    
    // Transactions page
    'lich_su_giao_dich': 'Transaction History',
    'xem_quan_ly_giao_dich': 'View and manage all your income and expense transactions',
    'them_thu_nhap_btn': 'Add Income',
    'them_chi_tieu_btn': 'Add Expense',
    'loai': 'Type',
    'tat_ca': 'All',
    'thu_nhap': 'Income',
    'chi_tieu': 'Expense',
    'nguoi_ghi': 'Recorded By',
    'danh_muc': 'Category',
    'mo_ta': 'Description',
    'so_tien': 'Amount',
    'thao_tac': 'Actions',
    'dang_tai_du_lieu': 'Loading data...',
    'chua_co_giao_dich': 'No transactions yet',
    
    // Reports page
    'nam': 'Year',
    'bao_cao_thu_chi': 'Financial Report',
    'bao_cao_don_hang': 'Order Report',
    'tong_thu_nhap': 'Total Income',
    'tong_chi_tieu': 'Total Expenses',
    'bieu_do_thu_chi_thoi_gian': 'Income/Expense Over Time',
    'bieu_do_chi_tieu_danh_muc': 'Expense By Category',
    'tong_so_don_hang': 'Total Orders',
    'tong_gia_tri_don_hang': 'Total Order Value',
    'doanh_thu_thoi_gian': 'Revenue Over Time',
    'phan_tich_trang_thai': 'Orders by Status',
    'hoan_thanh': 'Completed',
    'dang_xu_ly': 'Processing',
    'cho_xu_ly': 'Pending',
    'da_huy': 'Cancelled',
    'don_hang_text': 'orders',
    'so_luong': 'Quantity',
    
    // Products page
    'loi_tai_du_lieu': 'Error loading data',
    'khong_co_du_lieu_san_pham': 'No product data available',
    'khong_the_tai_ds_sp': 'Unable to load product list',
    'loi': 'Error',
    'tim_kiem': 'Search products',
    'san_pham_desc': 'Explore our product catalog',
    'gio_hang': 'Cart',
    'gio_hang_trong': 'Your cart is empty',
    'tiep_tuc_mua_hang': 'Continue shopping',
    'con_lai': 'Remaining',
    'chi_con_1': 'Only 1 available',
    'co_san': 'available',
    'tong_cong': 'Total',
    'thanh_toan': 'Checkout',
    'khong_tim_thay_sp': 'No products found',
    'thu_tim_kiem_khac': 'Try searching with a different keyword or view all products',
    'xem_tat_ca_sp': 'View all products',
    'sp_ko_san_sang': 'Product not available',
    'het_hang': 'Out of stock',
    'them_vao_gio': 'Add to cart',
    'mua_ngay': 'Buy now',
    
    // Orders page
    'don_hang_title': 'Orders',
    'don_hang_desc': 'View and manage all your orders',
    'them_don_hang': 'Add Order',
    'tim_kiem_don_hang': 'Search orders...',
    'ngay_dat_hang': 'Order date',
    'ma_don_hang': 'Order ID',
    'ten_khach_hang': 'Customer name',
    'trang_thai_don_hang': 'Order status',
    'trang_thai_thanh_toan': 'Payment status',
    'tat_ca_trang_thai': 'All statuses',
    'chi_tiet_don_hang': 'Order details',
    'cap_nhat_trang_thai': 'Update status',
    'thong_tin_khach_hang': 'Customer information',
    'thong_tin_don_hang': 'Order information',
    'danh_sach_mon': 'Item list',
    'san_pham_trong_don': 'Products in order',
    'tong_tien': 'Total',
    'chua_thanh_toan': 'Not paid',
    'da_thanh_toan': 'Paid',
    'dang_xu_ly_thanh_toan': 'Processing payment',
    'ngay_dat': 'Order date:',
    'ngay_giao': 'Delivery date:',
    'phuong_thuc_thanh_toan_label': 'Payment method:',
    'ghi_chu': 'Notes',
    'dong': 'Close',
    'khong_tim_thay_don_hang': 'No orders found',
    'so_dien_thoai': 'Phone number',
    'dia_chi': 'Address',
    'tao_don_hang': 'Create order',
    'tong_ket_don_hang': 'Order summary',
    'them_mon': 'Add item',
    'don_gia': 'Price',
    'huy': 'Cancel',
  },
};

// Provider component
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with browser language or default to Vietnamese
  const [language, setLanguage] = useState<Language>('vi');

  // Load language preference from localStorage on client side
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const translate = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}; 