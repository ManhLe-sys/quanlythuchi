import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password } = body;

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

    // Use environment variables
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    if (!process.env.GOOGLE_SHEETS_SHEET_ID) {
      throw new Error('Missing GOOGLE_SHEETS_SHEET_ID');
    }

    // Initialize document
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Lấy sheet đầu tiên
    const sheet = doc.sheetsByIndex[0];

    // Kiểm tra email đã tồn tại chưa
    const rows = await sheet.getRows();
    const existingUser = rows.find(row => row.get('email') === email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được đăng ký' },
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Generated hash:', hashedPassword);

    // Log để debug
    console.log('Attempting to save:', {
      fullName,
      email,
      hashedPassword,
      timestamp: new Date().toISOString()
    });

    // Kiểm tra sheet và cấu trúc
    console.log('Sheet title:', sheet.title);
    console.log('Sheet headers:', await sheet.headerValues);

    // Tạo timestamp cho thời gian đăng ký
    const registrationTime = new Date().toLocaleString('vi-VN', { 
      timeZone: 'Asia/Ho_Chi_Minh'
    });

    // Thêm user mới với đầy đủ thông tin
    const newRow = {
      'Họ và tên': fullName,
      'Email': email,
      'Mật khẩu': hashedPassword,
      'Ngày tạo': new Date().toISOString(),
      'Thời gian đăng ký': registrationTime
    };

    console.log('New row data:', newRow);

    try {
      const addedRow = await sheet.addRow(newRow);
      console.log('Row added successfully:', addedRow);
    } catch (error) {
      console.error('Error adding row:', error);
      throw error;
    }

    return NextResponse.json(
      { 
        message: 'Đăng ký thành công',
        savedData: newRow // Trả về data đã lưu để kiểm tra
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
} 