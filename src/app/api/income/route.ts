import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { loaiThu, moTa, soTien, nguoiGhi, ghiChu } = body;

    console.log('Received income data:', body);

    // Validate input
    if (!loaiThu || !moTa || !soTien || !nguoiGhi) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 
        !process.env.GOOGLE_SHEETS_PRIVATE_KEY || 
        !process.env.GOOGLE_SHEETS_SHEET_ID) {
      console.error('Missing environment variables');
      throw new Error('Missing required Google Sheets credentials');
    }

    console.log('Initializing Google Sheets connection...');

    // Use environment variables
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize document
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    console.log('Connected to Google Sheet:', doc.title);

    // Find the "Thu" sheet
    const sheet = doc.sheetsByTitle['Thu'];
    if (!sheet) {
      throw new Error('Sheet "Thu" not found');
    }

    console.log('Using sheet:', sheet.title);

    // Load headers first
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    console.log('Sheet headers:', headers);

    // Generate transaction ID (you can modify this logic as needed)
    const transactionId = `THU${Date.now()}`;

    // Prepare row data
    const rowData = {
      'Mã giao dịch': transactionId,
      'Ngày': new Date().toLocaleDateString('vi-VN'),
      'Loại thu': loaiThu,
      'Mô tả': moTa,
      'Số tiền': soTien,
      'Người ghi': nguoiGhi,
      'Ghi chú': ghiChu || '',
      'Thời gian tạo': new Date().toLocaleString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    };

    console.log('Attempting to add row with data:', rowData);

    // Add new income to sheet
    try {
      await sheet.addRow(rowData);
      console.log('Successfully added new income to sheet');
    } catch (error) {
      console.error('Error adding row to sheet:', error);
      throw error;
    }

    return NextResponse.json(
      { message: 'Thêm khoản thu thành công' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Income addition error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi thêm khoản thu', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 