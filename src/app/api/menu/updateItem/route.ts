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
    const { id, name, price, category, description, status, imageUrl } = await request.json();

    // Validate input
    if (!id || !name || !price || !category) {
      return NextResponse.json(
        { error: 'ID, tên món, giá và danh mục là bắt buộc' },
        { status: 400 }
      );
    }

    // Get all menu items
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'Menu!A:H',
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json(
        { error: 'Không tìm thấy món ăn' },
        { status: 404 }
      );
    }

    // Find the row index of the item to update
    const rowIndex = rows.findIndex(row => row[0] === id);
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy món ăn' },
        { status: 404 }
      );
    }

    // Prepare the updated row data
    const updatedRowData = [
      id,              // ID (A)
      name,            // Tên món (B)
      price,           // Giá (C)
      category,        // Danh mục (D)
      category,        // Danh mục (E) - duplicate as per sheet structure
      description || '', // Mô tả (F)
      status || 'active', // Trạng thái (G)
      imageUrl || ''    // URL hình ảnh (H)
    ];

    // Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: `Menu!A${rowIndex + 1}:H${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRowData],
      },
    });

    return NextResponse.json({ 
      message: 'Cập nhật món thành công',
      item: {
        id,
        name,
        price,
        category,
        description,
        status,
        imageUrl
      }
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Không thể cập nhật món' },
      { status: 500 }
    );
  }
} 