import { NextResponse } from 'next/server';
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const MENU_SHEET_NAME = 'Menu';
const REQUIRED_FIELDS = ['name', 'category', 'price'];

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

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

const parseMenuItem = (row: GoogleSpreadsheetRow): MenuItem => {
  return {
    id: row.get('id')?.toString() || '',
    name: row.get('name')?.toString() || '',
    category: row.get('category')?.toString() || '',
    price: Number(row.get('price')) || 0,
    description: row.get('description')?.toString() || '',
    isAvailable: row.get('isAvailable') === 'true',
    createdAt: row.get('createdAt')?.toString() || new Date().toISOString(),
    updatedAt: row.get('updatedAt')?.toString() || new Date().toISOString()
  };
};

export async function GET() {
  try {
    const doc = await getGoogleSheets();
    const sheet = doc.sheetsByTitle[MENU_SHEET_NAME];
    if (!sheet) {
      throw new Error('Menu sheet not found');
    }

    await sheet.loadCells();
    const rows = await sheet.getRows();
    const menuItems = rows.map(parseMenuItem);

    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tải dữ liệu menu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    // Add new menu item
    const now = new Date().toISOString();
    const newRow = {
      id: Date.now().toString(),
      name: body.name,
      category: body.category,
      price: price,
      description: body.description || '',
      isAvailable: body.isAvailable === undefined ? true : body.isAvailable,
      createdAt: now,
      updatedAt: now
    };

    await sheet.addRow(newRow);

    return NextResponse.json({ 
      message: 'Thêm món thành công',
      menuItem: newRow
    });
  } catch (error) {
    console.error('Error adding menu item:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi thêm món' },
      { status: 500 }
    );
  }
} 