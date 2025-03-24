import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Check for required environment variables
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 
        !process.env.GOOGLE_SHEETS_PRIVATE_KEY || 
        !process.env.GOOGLE_SHEETS_SHEET_ID) {
      console.error('Missing environment variables');
      throw new Error('Missing required Google Sheets credentials');
    }

    // Initialize auth
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize document
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Get both Thu and Chi sheets
    const thuSheet = doc.sheetsByTitle['Thu'];
    const chiSheet = doc.sheetsByTitle['Chi'];

    if (!thuSheet || !chiSheet) {
      throw new Error('Required sheets not found');
    }

    // Load rows from both sheets
    const thuRows = await thuSheet.getRows();
    const chiRows = await chiSheet.getRows();

    // Transform Thu rows
    const thuTransactions = thuRows.map(row => ({
      id: row.get('Mã giao dịch'),
      date: row.get('Ngày'),
      type: 'Thu',
      category: row.get('Loại thu'),
      description: row.get('Mô tả'),
      amount: row.get('Số tiền'),
      recordedBy: row.get('Người ghi'),
      notes: row.get('Ghi chú'),
      createdAt: row.get('Thời gian tạo')
    }));

    // Transform Chi rows
    const chiTransactions = chiRows.map(row => ({
      id: row.get('Mã giao dịch'),
      date: row.get('Ngày'),
      type: 'Chi',
      category: row.get('Loại chi'),
      description: row.get('Mô tả'),
      amount: row.get('Số tiền'),
      recordedBy: row.get('Người ghi'),
      notes: row.get('Ghi chú'),
      createdAt: row.get('Thời gian tạo')
    }));

    // Combine all transactions
    const allTransactions = [...thuTransactions, ...chiTransactions];

    return NextResponse.json({
      transactions: allTransactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tải dữ liệu giao dịch' },
      { status: 500 }
    );
  }
} 