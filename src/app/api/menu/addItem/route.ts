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
    const { name, price, category, description, status, imageUrl, quantity } = await request.json();

    // Validate input
    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Tên món, giá và danh mục là bắt buộc' },
        { status: 400 }
      );
    }

    // Generate a unique ID (timestamp)
    const id = Date.now().toString();

    // Prepare the row data according to the sheet structure
    const rowData = [
      id,              // ID (A)
      name,            // Tên món (B)
      price,           // Giá (C)
      category,        // Danh mục (D)
      category,        // Danh mục (E) - duplicate as per sheet structure
      description || '', // Mô tả (F)
      status || 'active', // Trạng thái (G)
      imageUrl || '',    // URL hình ảnh (H)
      quantity || '0'    // Số lượng (I)
    ];

    // Append the new item to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'Menu!A:I', // Updated range to include all columns including quantity
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({ 
      message: 'Thêm món thành công',
      item: {
        id,
        name,
        price,
        category,
        description,
        status,
        imageUrl,
        quantity
      }
    });
  } catch (error) {
    console.error('Error adding menu item:', error);
    return NextResponse.json(
      { error: 'Không thể thêm món mới' },
      { status: 500 }
    );
  }
} 