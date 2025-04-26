import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Khởi tạo Google Sheets API
const auth = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ID của Google Spreadsheet
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SHEET_ID;

// Tên các sheet
const SHEETS = {
  DON_HANG: 'Đơn hàng',
  MENU: 'Menu',
  DANH_MUC: 'Danh mục',
  LICH_SU_GIA: 'Lichsugia',
  CHI_TIET_DON_HANG: 'Đơn hàng chi tiết',
};

// Interface cho menu item
interface MenuItem {
  ma_mon: string;
  ten_mon: string;
  ma_danh_muc: string;
  gia_ban: number;
  mo_ta: string;
  hinh_anh: string;
  trang_thai: string;
}

interface OrderItem {
  ma_mon: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

interface NewOrder {
  ten_khach: string;
  so_dien_thoai: string;
  dia_chi: string;
  ngay_dat: string;
  ngay_giao: string;
  danh_sach_mon: OrderItem[];
  phuong_thuc_thanh_toan?: string;
  ghi_chu?: string;
}

// Interface cho chi tiết đơn hàng dạng chuỗi
interface OrderDetailString {
  ma_mon: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

// Interface cho đơn hàng
interface Order {
  id: string;
  ma_don: string;
  ten_khach: string;
  so_dien_thoai: string;
  dia_chi: string;
  ngay_dat: string;
  ngay_giao: string;
  tong_tien: number;
  trang_thai: string;
  trang_thai_thanh_toan: string;
  phuong_thuc_thanh_toan: string;
  ghi_chu: string;
  id_nguoi_tao: string;
  thoi_gian_tao: string;
  thoi_gian_cap_nhat: string;
  chi_tiet: string;
}

export async function createNewOrder(order: NewOrder) {
  try {
    // 1. Lấy danh sách menu items
    const menuItems = await getMenuItems();
    if (!menuItems || menuItems.length === 0) {
      return {
        success: false,
        message: 'Không thể lấy danh sách món ăn',
      };
    }

    // 2. Lấy mã đơn hàng mới
    const lastOrder = await getLastOrder();
    const maDon = generateOrderCode(lastOrder?.ma_don || 'ORD000');

    // 3. Tính tổng tiền
    const tongTien = order.danh_sach_mon.reduce((sum, item) => sum + item.thanh_tien, 0);

    // 4. Tạo ID đơn hàng mới
    const newOrderId = generateOrderId(lastOrder?.id || 'DH000');

    // 5. Tạo dữ liệu đơn hàng mới
    const newOrderData = [
      [
        newOrderId, // A: ID đơn hàng
        maDon, // B: Mã đơn hàng
        order.ten_khach, // C: Tên khách hàng
        order.so_dien_thoai, // D: Số điện thoại
        order.dia_chi, // E: Địa chỉ
        order.ngay_dat, // F: Ngày đặt
        order.ngay_giao, // G: Ngày giao
        tongTien, // H: Tổng tiền
        'Chờ xử lý', // I: Trạng thái
        'Chưa thanh toán', // J: Trạng thái thanh toán
        order.phuong_thuc_thanh_toan || '', // K: Phương thức thanh toán
        order.ghi_chu || '', // L: Ghi chú
        '1', // M: ID người tạo
        new Date().toISOString(), // N: Thời gian tạo
        new Date().toISOString(), // O: Thời gian cập nhật
      ],
    ];

    // 6. Thêm đơn hàng mới vào sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.DON_HANG}!A:O`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: newOrderData,
      },
    });

    // 7. Tạo dữ liệu chi tiết đơn hàng
    const chiTietDonHangData = order.danh_sach_mon.map((item, index) => {
      // Lấy thông tin món từ menu
      const menuItem = menuItems.find(menu => menu.ma_mon === item.ma_mon);
      return [
        newOrderId, // A: ID đơn hàng
        maDon, // B: Mã đơn hàng
        index + 1, // C: STT
        item.ma_mon, // D: Mã món
        menuItem?.ten_mon || '', // E: Tên món
        'Cái', // F: Đơn vị tính
        item.so_luong, // G: Số lượng
        item.don_gia, // H: Đơn giá
        item.thanh_tien, // I: Thành tiền
        '', // J: Ghi chú
        '1', // K: ID người tạo
        new Date().toISOString(), // L: Thời gian tạo
        new Date().toISOString(), // M: Thời gian cập nhật
      ];
    });

    // 8. Thêm chi tiết đơn hàng vào sheet chi tiết
    if (chiTietDonHangData.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.CHI_TIET_DON_HANG}!A:M`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: chiTietDonHangData,
        },
      });
    }

    return {
      success: true,
      ma_don: maDon,
      id: newOrderId,
      message: 'Tạo đơn hàng thành công',
    };
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    return {
      success: false,
      message: 'Có lỗi xảy ra khi tạo đơn hàng',
    };
  }
}

// Hàm lấy đơn hàng cuối cùng
async function getLastOrder(): Promise<Order | null> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.DON_HANG}!A:P`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return null;

    // Lấy dòng cuối cùng (bỏ qua header)
    const lastRow = rows[rows.length - 1];
    return {
      id: lastRow[0],
      ma_don: lastRow[1],
      ten_khach: lastRow[2],
      so_dien_thoai: lastRow[3],
      dia_chi: lastRow[4],
      ngay_dat: lastRow[5],
      ngay_giao: lastRow[6],
      tong_tien: parseFloat(lastRow[7]),
      trang_thai: lastRow[8],
      trang_thai_thanh_toan: lastRow[9],
      phuong_thuc_thanh_toan: lastRow[10],
      ghi_chu: lastRow[11],
      id_nguoi_tao: lastRow[12],
      thoi_gian_tao: lastRow[13],
      thoi_gian_cap_nhat: lastRow[14],
      chi_tiet: lastRow[15] || '',
    };
  } catch (error) {
    console.error('Lỗi khi lấy đơn hàng cuối:', error);
    return null;
  }
}

// Hàm tạo mã đơn hàng mới
function generateOrderCode(lastCode: string): string {
  const prefix = 'ORD';
  const currentNumber = parseInt(lastCode.replace(prefix, '')) || 0;
  const newNumber = currentNumber + 1;
  return `${prefix}${String(newNumber).padStart(3, '0')}`;
}

// Hàm tạo ID đơn hàng mới
function generateOrderId(lastId: string): string {
  const prefix = 'DH';
  const currentNumber = parseInt(lastId.replace(prefix, '')) || 0;
  const newNumber = currentNumber + 1;
  return `${prefix}${String(newNumber).padStart(3, '0')}`;
}

// Hàm lấy thông tin món từ menu
export async function getMenuItems() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.MENU}!A:H`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    // Bỏ qua header và chuyển đổi dữ liệu
    return rows.slice(1).map(row => {
      // Xử lý trường hợp giá được nhập lặp lại trong cột C
      const priceStr = row[2] || '0';
      const prices = priceStr.split(' ');
      const price = parseFloat(prices[0] || '0');

      return {
        ma_mon: row[0] || '', // ID
        ten_mon: row[1] || '', // Tên món
        gia_ban: price, // Lấy giá đầu tiên nếu có nhiều giá
        ma_danh_muc: row[3] || '', // Danh mục
        mo_ta: row[4] || '', // Mô tả
        trang_thai: row[5]?.toLowerCase() || 'inactive', // Trạng thái
        hinh_anh: row[6] || '', // URL hình ảnh
      };
    }).filter(item => item.ma_mon && item.ten_mon); // Chỉ lấy các món có mã và tên
  } catch (error) {
    console.error('Lỗi khi lấy danh sách món:', error);
    return [];
  }
}

// Hàm lấy danh sách danh mục
export async function getCategories() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.DANH_MUC}!A:H`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    // Bỏ qua header và chuyển đổi dữ liệu
    return rows.slice(1).map(row => ({
      ma_danh_muc: row[0],
      ten_danh_muc: row[1],
      ma_danh_muc_cha: row[2],
      mo_ta: row[3],
      trang_thai: row[4],
    }));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    return [];
  }
}

// Hàm lấy danh sách đơn hàng
export async function getOrders(menuItems: MenuItem[]) {
  try {
    // 1. Lấy danh sách đơn hàng
    const orderResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.DON_HANG}!A:O`,
    });

    const orders = orderResponse.data.values || [];
    if (!orders || orders.length <= 1) return [];

    // 2. Lấy danh sách chi tiết đơn hàng
    const detailResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.CHI_TIET_DON_HANG}!A:M`,
    });

    const details = detailResponse.data.values || [];
    const orderDetails = new Map();

    // Nhóm chi tiết đơn hàng theo ID đơn hàng
    if (details.length > 1) {
      details.slice(1).forEach(detail => {
        const orderId = detail[0]; // ID đơn hàng
        if (!orderDetails.has(orderId)) {
          orderDetails.set(orderId, []);
        }
        orderDetails.get(orderId).push({
          stt: detail[2],
          ma_mon: detail[3],
          ten_mon: detail[4],
          don_vi_tinh: detail[5],
          so_luong: parseInt(detail[6]),
          don_gia: parseFloat(detail[7]),
          thanh_tien: parseFloat(detail[8]),
          ghi_chu: detail[9],
        });
      });
    }

    // 3. Chuyển đổi dữ liệu đơn hàng
    return orders.slice(1).map(order => {
      const orderId = order[0];
      const orderDetail = orderDetails.get(orderId) || [];

      // Tạo chuỗi sản phẩm để hiển thị
      const sanPham = orderDetail
        .map((detail: any) => `${detail.ten_mon} (x${detail.so_luong})`)
        .join(', ');

      return {
        id: order[0],
        ma_don: order[1],
        ten_khach: order[2],
        so_dien_thoai: order[3],
        dia_chi: order[4],
        ngay_dat: order[5],
        ngay_giao: order[6],
        tong_tien: parseFloat(order[7]),
        trang_thai: order[8],
        trang_thai_thanh_toan: order[9],
        phuong_thuc_thanh_toan: order[10],
        ghi_chu: order[11],
        id_nguoi_tao: order[12],
        thoi_gian_tao: order[13],
        thoi_gian_cap_nhat: order[14],
        san_pham: sanPham,
        chi_tiet: orderDetail,
      };
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    return [];
  }
}

// Hàm lấy chi tiết đơn hàng theo mã đơn
export async function getOrderDetails(orderId: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.CHI_TIET_DON_HANG}!A:M`,
    });

    const rows = response.data.values || [];
    if (!rows || rows.length <= 1) return [];

    // Lọc các dòng có ID đơn hàng trùng khớp
    return rows.slice(1)
      .filter(row => row[0] === orderId)
      .map((row, index) => ({
        stt: row[2] || (index + 1),
        ma_mon: row[3],
        ten_mon: row[4],
        don_vi_tinh: row[5],
        so_luong: parseInt(row[6]),
        don_gia: parseFloat(row[7]),
        thanh_tien: parseFloat(row[8]),
        ghi_chu: row[9] || '',
      }));
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
    return [];
  }
} 