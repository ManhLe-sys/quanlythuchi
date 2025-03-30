import { google } from 'googleapis';
import { NextResponse } from 'next/server';

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
    const { email, newRole } = await request.json();

    // Validate input
    if (!email || !newRole) {
      return NextResponse.json(
        { error: 'Email and new role are required' },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles = ['admin', 'STAFF', 'customer'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, STAFF, customer' },
        { status: 400 }
      );
    }

    // Tìm user trong sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'A2:E', // Get all columns from row 2 onwards
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Tìm index của user cần cập nhật vai trò
    const rowIndex = rows.findIndex(row => row[1] === email);
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update vai trò trong sheet (cột E - index 4)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: `E${rowIndex + 2}`, // +2 vì index bắt đầu từ 0 và header ở hàng 1
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newRole]],
      },
    });

    return NextResponse.json({ 
      message: 'Role updated successfully',
      user: {
        email,
        newRole
      }
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
} 