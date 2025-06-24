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

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'Menu!A2:I', // Updated range to include quantity column
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json({ items: [] });
    }

    const items = rows.map(row => ({
      id: row[0],         // ID (A)
      name: row[1],       // Tên món (B)
      price: Number(row[2]), // Giá (C)
      category: row[3],   // Danh mục (D)
      // Skip row[4] as it's a duplicate category
      description: row[5] || '', // Mô tả (F)
      status: row[6] || 'active', // Trạng thái (G)
      imageUrl: row[7] || '', // URL hình ảnh (H)
      quantity: Number(row[8] || 0) // Số lượng (I)
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách món' },
      { status: 500 }
    );
  }
} 