import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

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
    
    console.log('User role for update:', userRole);
    
    // Only admin can change roles
    if (userRole !== 'admin' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can change roles' },
        { status: 403 }
      );
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'ADMIN', 'STAFF', 'staff', 'customer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

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

    // Find index of user to update
    const rowIndex = rows.findIndex(row => row[1] === email);
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update role in sheet (column E - index 4)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: `E${rowIndex + 2}`, // +2 because index starts at 0 and header is row 1
      valueInputOption: 'RAW',
      requestBody: {
        values: [[role]],
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Role updated successfully',
      data: {
        email: email,
        role: role
      } 
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update role',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 