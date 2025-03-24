import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password } = body;

    console.log('Received registration request:', { fullName, email });

    // Validate input
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 
        !process.env.GOOGLE_SHEETS_PRIVATE_KEY || 
        !process.env.GOOGLE_SHEETS_SHEET_ID) {
      console.error('Missing environment variables');
      throw new Error('Missing required Google Sheets credentials');
    }

    console.log('Initializing Google Sheets connection...');

    // Use environment variables
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize document
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    console.log('Connected to Google Sheet:', doc.title);

    // Lấy sheet đầu tiên
    const sheet = doc.sheetsByIndex[0];
    console.log('Using sheet:', sheet.title);

    // Load headers first
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    console.log('Sheet headers:', headers);

    // Kiểm tra email đã tồn tại chưa
    const rows = await sheet.getRows();
    console.log('Current row count:', rows.length);
    
    const existingUser = rows.find(row => row.get('Email') === email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare row data matching sheet headers
    const rowData = {
      'Họ và tên': fullName,
      'Email': email,
      'Mật khẩu': hashedPassword,
      'Ngày tạo': new Date().toISOString(),
      'Thời gian đăng ký': new Date().toLocaleString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    };

    console.log('Attempting to add row with data:', rowData);

    // Add new user to sheet
    try {
      await sheet.addRow(rowData);
      console.log('Successfully added new user to sheet');
    } catch (error) {
      console.error('Error adding row to sheet:', error);
      throw error;
    }

    return NextResponse.json(
      { message: 'Đăng ký thành công' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng ký', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 