import { GoogleSpreadsheetRow, GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

interface Sheet {
  title: string;
  getRows: () => Promise<GoogleSpreadsheetRow[]>;
}

async function getGoogleSheets(): Promise<{ sheets: Sheet[] }> {
  if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 
      !process.env.GOOGLE_SHEETS_PRIVATE_KEY || 
      !process.env.GOOGLE_SHEETS_SHEET_ID) {
    throw new Error('Missing required Google Sheets credentials');
  }

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();

  const sheets = Object.values(doc.sheetsByTitle) as Sheet[];
  return { sheets };
}

export async function GET(req: Request) {
  try {
    const { sheets } = await getGoogleSheets();

    const thuSheet = sheets.find((sheet: Sheet) => sheet.title === 'Thu');
    const chiSheet = sheets.find((sheet: Sheet) => sheet.title === 'Chi');

    if (!thuSheet || !chiSheet) {
      throw new Error('Không tìm thấy sheet Thu hoặc Chi');
    }

    const thuRows = await thuSheet.getRows();
    const chiRows = await chiSheet.getRows();

    // Function to parse amount string to number
    const parseAmount = (amountStr: string): number => {
      try {
        // Remove currency symbol, commas and spaces
        const cleanStr = amountStr.replace(/[^\d.-]/g, '');
        const amount = Number(cleanStr);
        
        // Log for debugging
        console.log('Parsing amount:', {
          original: amountStr,
          cleaned: cleanStr,
          parsed: amount
        });
        
        return isNaN(amount) ? 0 : amount;
      } catch (error) {
        console.error('Error parsing amount:', amountStr, error);
        return 0;
      }
    };

    // Function to parse date string to YYYY-MM-DD format
    const parseDate = (dateStr: string): string => {
      try {
        const [day, month, year] = dateStr.split('/').map(num => num.trim());
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } catch (error) {
        console.error('Error parsing date:', dateStr);
        return dateStr;
      }
    };

    // Process Thu transactions
    const thuTransactions = thuRows.map((row: GoogleSpreadsheetRow) => {
      const amount = parseAmount(row.get('Số tiền'));
      const date = parseDate(row.get('Ngày'));
      
      // Log for debugging
      console.log('Processing Thu transaction:', {
        id: row.get('Mã giao dịch'),
        amount,
        date
      });
      
      return {
        id: row.get('Mã giao dịch'),
        date,
        type: 'Thu',
        category: row.get('Loại thu'),
        description: row.get('Mô tả'),
        amount,
        recordedBy: row.get('Người ghi'),
        notes: row.get('Ghi chú'),
        createdAt: row.get('Thời gian tạo')
      };
    }).filter(t => t.amount > 0);

    // Process Chi transactions
    const chiTransactions = chiRows.map((row: GoogleSpreadsheetRow) => {
      const amount = parseAmount(row.get('Số tiền'));
      const date = parseDate(row.get('Ngày'));
      
      // Log for debugging
      console.log('Processing Chi transaction:', {
        id: row.get('Mã giao dịch'),
        amount,
        date
      });
      
      return {
        id: row.get('Mã giao dịch'),
        date,
        type: 'Chi',
        category: row.get('Loại chi'),
        description: row.get('Mô tả'),
        amount,
        recordedBy: row.get('Người ghi'),
        notes: row.get('Ghi chú'),
        createdAt: row.get('Thời gian tạo')
      };
    }).filter(t => t.amount > 0);

    // Combine and sort all transactions
    const allTransactions = [...thuTransactions, ...chiTransactions].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Log some sample data for debugging
    console.log('Sample transactions:', {
      total: allTransactions.length,
      firstFew: allTransactions.slice(0, 3).map(t => ({
        date: t.date,
        type: t.type,
        amount: t.amount,
        recordedBy: t.recordedBy
      }))
    });

    return NextResponse.json({ transactions: allTransactions });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tải dữ liệu giao dịch' },
      { status: 500 }
    );
  }
} 