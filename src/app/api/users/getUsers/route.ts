import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function GET() {
  try {
    if (!process.env.GOOGLE_SHEETS_SHEET_ID) {
      throw new Error('Sheet ID is not configured');
    }

    // Lấy dữ liệu từ sheet đầu tiên, bao gồm cả cột E (vai trò)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'A2:E', // Lấy từ cột A đến E, bắt đầu từ hàng 2
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const users = rows.map((row, index) => {
      // Đảm bảo mỗi row có đủ 5 cột
      const [fullName = '', email = '', registrationTime = '', password = '', role = ''] = row;
      return {
        id: (index + 1).toString(), // Sử dụng index làm id
        fullName: fullName.toString(),
        email: email.toString(),
        role: role.toString(),
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 