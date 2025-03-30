import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Khởi tạo Google Sheets API
const sheets = google.sheets('v4');

// Thông tin về Google Sheet
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Users';

export async function POST(req: Request) {
  try {
    // Kiểm tra xác thực
    const session = await getServerSession(authOptions);
    console.log('Current session:', session); // Debug log

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Kiểm tra quyền admin
    const userRole = (session.user as any).role;
    console.log('User role:', userRole); // Debug log

    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Lấy dữ liệu từ request
    const { email, newRole } = await req.json();
    console.log('Request data:', { email, newRole }); // Debug log

    if (!email || !newRole) {
      return NextResponse.json(
        { error: 'Email and new role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'staff', 'customer'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Xác thực với Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Lấy dữ liệu từ sheet
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:E`,
    });

    const rows = response.data.values || [];
    console.log('Total rows:', rows.length); // Debug log

    // Tìm user theo email
    const userRowIndex = rows.findIndex((row) => row[2] === email);
    console.log('User row index:', userRowIndex); // Debug log

    if (userRowIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cập nhật role trong sheet
    // Cột E (index 4) chứa role
    const range = `${SHEET_NAME}!E${userRowIndex + 1}`;
    console.log('Update range:', range); // Debug log

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newRole]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in changeRole:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 