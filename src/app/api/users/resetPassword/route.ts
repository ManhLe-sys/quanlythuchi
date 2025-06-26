import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import bcrypt from 'bcryptjs';

// Direct Google Sheets authentication
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
    // Get user from NextAuth session
    const session = await getServerSession(authOptions);
    let userRole = session?.user?.role;
    
    // If no session, check for custom auth header
    if (!userRole) {
      const authHeader = request.headers.get('x-user-role');
      if (authHeader) {
        userRole = authHeader;
      }
    }
    
    console.log('User role for password reset:', userRole);
    
    // Only admin can reset passwords
    if (userRole !== 'admin' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can reset passwords' },
        { status: 403 }
      );
    }

    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Validate password
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find user in sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'A2:E',
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find index of user to update password
    const rowIndex = rows.findIndex(row => row[1] === email);
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password in sheet (column D - index 3)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: `D${rowIndex + 2}`, // +2 because index starts at 0 and header is row 1
      valueInputOption: 'RAW',
      requestBody: {
        values: [[hashedPassword]],
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully',
      data: {
        email: email
      } 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 