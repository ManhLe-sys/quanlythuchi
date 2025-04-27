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
    const { id } = await request.json();

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: 'ID món ăn là bắt buộc' },
        { status: 400 }
      );
    }

    // Get all menu items
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'Menu!A:I',
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json(
        { error: 'Không tìm thấy món ăn' },
        { status: 404 }
      );
    }

    // Find the row index of the item to delete/deactivate
    const rowIndex = rows.findIndex(row => row[0] === id);
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy món ăn' },
        { status: 404 }
      );
    }

    // Instead of deleting, update the status to 'inactive'
    const row = rows[rowIndex];
    // Create a new row with the status changed to 'inactive'
    const updatedRow = [...row];
    // Status is in column G (index 6)
    updatedRow[6] = 'inactive';

    // Update the row with the new status
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: `Menu!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow],
      },
    });

    return NextResponse.json({ 
      message: 'Đã ngừng bán món thành công',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deactivating menu item:', error);
    return NextResponse.json(
      { error: 'Không thể ngừng bán món' },
      { status: 500 }
    );
  }
} 