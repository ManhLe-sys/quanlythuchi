import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Direct Google Sheets authentication
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Lấy thông tin người dùng từ Google Sheets
export async function GET(req: NextRequest) {
  try {
    // Lấy thông tin người dùng từ session
    const session = await getServerSession(authOptions);
    
    // Lấy thông tin từ headers nếu session là null
    const userEmail = session?.user?.email || req.headers.get('x-user-email');
    const userRole = session?.user?.role || req.headers.get('x-user-role');
    
    // Kiểm tra xem có thông tin người dùng hay không
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized - No user information' }, { status: 401 });
    }
    
    // Nếu role không phải admin và email từ URL khác với email của người dùng
    const urlEmail = req.nextUrl.searchParams.get('email');
    if (userRole !== 'admin' && urlEmail && urlEmail !== userEmail) {
      return NextResponse.json({ error: 'Forbidden - Cannot access another user profile' }, { status: 403 });
    }
    
    // Lấy email người dùng cần xem thông tin
    const email = urlEmail || userEmail;
    
    // Kiểm tra quyền truy cập: Chỉ có thể xem thông tin của chính mình hoặc admin có thể xem tất cả
    if (email !== userEmail && userRole !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized', 
        debug: {
          emailRequested: email,
          userEmail: userEmail,
          userRole: userRole
        }
      }, { status: 403 });
    }

    try {
      // Lấy dữ liệu từ Google Sheets
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
        range: 'A2:G', // Đọc từ dòng 2 đến dòng cuối, cột A đến G
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return NextResponse.json({ success: false, message: 'No data found' }, { status: 404 });
      }

      // Tìm người dùng theo email (cột B - index 1)
      const userRowIndex = rows.findIndex((row) => row[1] === email);
      
      if (userRowIndex === -1) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }

      const userRow = rows[userRowIndex];
      
      // Dựa vào cấu trúc của sheet: [Họ và tên, Email, Thời gian đăng ký, Mật khẩu, Vai trò, Số điện thoại, Địa chỉ]
      const userData = {
        fullName: userRow[0] || '',
        email: userRow[1] || '',
        registrationTime: userRow[2] || '',
        role: userRow[4] || 'user',
        phoneNumber: userRow[5] || '',
        address: userRow[6] || '',
      };

      return NextResponse.json({ success: true, data: userData });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// Cập nhật thông tin người dùng vào Google Sheets
export async function PUT(req: NextRequest) {
  try {
    // Lấy thông tin người dùng từ session
    const session = await getServerSession(authOptions);
    
    // Lấy thông tin từ headers nếu session là null
    const userEmail = session?.user?.email || req.headers.get('x-user-email');
    const userRole = session?.user?.role || req.headers.get('x-user-role');
    
    // Kiểm tra xem có thông tin người dùng hay không
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized - No user information' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Nếu role không phải admin và body.email khác với email của người dùng
    if (userRole !== 'admin' && body.email !== userEmail) {
      return NextResponse.json({ error: 'Forbidden - Cannot update another user profile' }, { status: 403 });
    }
    
    try {
      // Lấy dữ liệu từ Google Sheets
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
        range: 'A2:G', // Mở rộng range để bao gồm số điện thoại và địa chỉ
      });
      
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return NextResponse.json({ success: false, message: 'No data found' }, { status: 404 });
      }
      
      // Tìm người dùng theo email (cột B - index 1)
      const userRowIndex = rows.findIndex((row) => row[1] === body.email);
      
      if (userRowIndex === -1) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      
      // Cập nhật thông tin người dùng
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
        range: `A${userRowIndex + 2}`, // +2 vì index bắt đầu từ 0 và header ở hàng 1
        valueInputOption: 'RAW',
        requestBody: {
          values: [[body.fullName]],
        },
      });
      
      // Cập nhật số điện thoại
      if (body.phoneNumber !== undefined) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
          range: `F${userRowIndex + 2}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[body.phoneNumber]],
          },
        });
      }
      
      // Cập nhật địa chỉ
      if (body.address !== undefined) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
          range: `G${userRowIndex + 2}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[body.address]],
          },
        });
      }
      
      // Nếu là admin, có thể cập nhật vai trò (cột E)
      if (userRole === 'admin' && body.role) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
          range: `E${userRowIndex + 2}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[body.role]],
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'User profile updated successfully',
        data: {
          email: body.email,
          fullName: body.fullName,
          role: body.role || rows[userRowIndex][4] || 'user',
          phoneNumber: body.phoneNumber || rows[userRowIndex][5] || '',
          address: body.address || rows[userRowIndex][6] || '',
        },
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to update user profile',
          error: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update user profile',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 