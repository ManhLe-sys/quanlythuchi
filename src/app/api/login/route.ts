import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    if (!process.env.GOOGLE_SHEETS_SHEET_ID) {
      throw new Error('Missing GOOGLE_SHEETS_SHEET_ID');
    }

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // Tìm user theo email
    const rows = await sheet.getRows();
    const user = rows.find(row => row.get('Email').toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log('User not found with email:', email);
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Lấy mật khẩu đã hash từ Google Sheets
    const storedPassword = user.get('Mật khẩu');
    
    // Debug logs
    console.log('Login attempt:');
    console.log('Email:', email);
    console.log('Input password:', password);
    console.log('Stored hashed password:', storedPassword);

    if (!storedPassword) {
      console.error('No password found in database for user:', email);
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // So sánh mật khẩu
    const passwordMatch = await bcrypt.compare(password, storedPassword);
    console.log('Password match result:', passwordMatch);

    if (passwordMatch) {
      // Lấy thông tin user từ sheet
      const userData = {
        email: user.get('Email'),
        fullName: user.get('Họ và tên')
      };

      const token = jwt.sign(
        { 
          email: userData.email,
          fullName: userData.fullName
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      return NextResponse.json({
        success: true,
        message: 'Đăng nhập thành công',
        token,
        user: userData
      });
    }

    // Fallback error response
    return NextResponse.json(
      { error: 'Email hoặc mật khẩu không đúng' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    );
  }
} 