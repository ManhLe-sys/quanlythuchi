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

export async function POST(request: Request) {
  try {
    // Lấy thông tin người dùng từ session
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    
    // Chỉ admin mới có quyền thay đổi mật khẩu của người khác
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can reset passwords' },
        { status: 403 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Tìm user trong sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'A2:E',
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Tìm index của user cần đổi mật khẩu
    const rowIndex = rows.findIndex(row => row[1] === email);
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update mật khẩu trong sheet (cột D - index 3)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: `D${rowIndex + 2}`, // +2 vì index bắt đầu từ 0 và header ở hàng 1
      valueInputOption: 'RAW',
      requestBody: {
        values: [[password]],
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully',
      data: {
        email: email
      } 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 