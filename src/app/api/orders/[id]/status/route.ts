import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { trang_thai, trang_thai_thanh_toan } = await request.json();
    const orderId = params.id;

    // Kiểm tra biến môi trường
    const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

    if (!spreadsheetId) {
      console.error('GOOGLE_SHEETS_SHEET_ID is not defined in environment variables');
      return NextResponse.json(
        { success: false, message: 'Cấu hình server chưa hoàn chỉnh: Thiếu GOOGLE_SHEETS_SHEET_ID' },
        { status: 500 }
      );
    }

    if (!clientEmail || !privateKey) {
      console.error('Google credentials are not defined in environment variables');
      return NextResponse.json(
        { success: false, message: 'Cấu hình server chưa hoàn chỉnh: Thiếu thông tin xác thực Google' },
        { status: 500 }
      );
    }

    // Khởi tạo Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Lấy dữ liệu từ sheet đơn hàng
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Đơn hàng!A:O',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy dữ liệu đơn hàng' },
        { status: 404 }
      );
    }

    // Tìm hàng chứa đơn hàng cần cập nhật
    const orderRowIndex = rows.findIndex(row => row[1] === orderId);
    if (orderRowIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    // Cập nhật trạng thái đơn hàng nếu có
    if (trang_thai) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `Đơn hàng!I${orderRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[trang_thai]],
        },
      });
    }

    // Cập nhật trạng thái thanh toán nếu có
    if (trang_thai_thanh_toan) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `Đơn hàng!J${orderRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[trang_thai_thanh_toan]],
        },
      });
    }

    // Cập nhật thời gian cập nhật
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `Đơn hàng!O${orderRowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[new Date().toISOString()]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng' },
      { status: 500 }
    );
  }
} 