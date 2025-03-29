import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const MENU_SHEET_NAME = 'Menu';
const REQUIRED_FIELDS = ['name', 'category', 'price'];

const getGoogleSheets = async () => {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
    throw new Error('Missing environment variables for Google Sheets');
  }

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Thiếu trường ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate price
    const price = Number(body.price);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Giá không hợp lệ' },
        { status: 400 }
      );
    }

    const doc = await getGoogleSheets();
    const sheet = doc.sheetsByTitle[MENU_SHEET_NAME];
    if (!sheet) {
      throw new Error('Menu sheet not found');
    }

    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id') === id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy món này' },
        { status: 404 }
      );
    }

    const row = rows[rowIndex];
    const updatedData = {
      ...body,
      price,
      updatedAt: new Date().toISOString()
    };

    // Update row values
    Object.entries(updatedData).forEach(([key, value]) => {
      row.set(key, value);
    });

    await row.save();

    return NextResponse.json({ 
      message: 'Cập nhật thành công',
      menuItem: {
        id,
        ...updatedData
      }
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật món' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const doc = await getGoogleSheets();
    const sheet = doc.sheetsByTitle[MENU_SHEET_NAME];
    if (!sheet) {
      throw new Error('Menu sheet not found');
    }

    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id') === id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy món này' },
        { status: 404 }
      );
    }

    const row = rows[rowIndex];
    const updatedData = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    // Update row values
    Object.entries(updatedData).forEach(([key, value]) => {
      row.set(key, value);
    });

    await row.save();

    return NextResponse.json({ 
      message: 'Cập nhật thành công',
      menuItem: {
        id,
        ...updatedData
      }
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật món' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const doc = await getGoogleSheets();
    const sheet = doc.sheetsByTitle[MENU_SHEET_NAME];
    if (!sheet) {
      throw new Error('Menu sheet not found');
    }

    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id') === id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy món này' },
        { status: 404 }
      );
    }

    await rows[rowIndex].delete();

    return NextResponse.json({ 
      message: 'Xóa món thành công'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa món' },
      { status: 500 }
    );
  }
} 