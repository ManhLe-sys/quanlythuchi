import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Direct Google Sheets authentication
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function GET(request: Request) {
  try {
    // Lấy thông tin người dùng từ session
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    
    // Chỉ admin mới có quyền xem tất cả người dùng
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can view all users' },
        { status: 403 }
      );
    }

    // Lấy dữ liệu từ Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'A2:G', // Đọc từ dòng 2 đến dòng cuối, cột A đến G
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // Chuyển đổi dữ liệu từ sheet thành danh sách người dùng
    // [Họ và tên, Email, Thời gian đăng ký, Mật khẩu, Vai trò, Số điện thoại, Địa chỉ]
    const users = rows.map((row, index) => ({
      id: index.toString(), // Sử dụng index làm ID
      fullName: row[0] || '',
      email: row[1] || '',
      registrationTime: row[2] || '',
      role: row[4] || 'customer',
      phoneNumber: row[5] || '',
      address: row[6] || '',
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 