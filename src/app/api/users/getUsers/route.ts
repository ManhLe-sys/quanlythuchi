import { google } from 'googleapis';
import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  try {
    // Try get user from NextAuth session
    const session = await getServerSession(authOptions);
    console.log("authOptions", authOptions);
    console.log("session", session);
    let userRole = session?.user?.role;
    
    // If no session, check for authorization header (custom auth)
    if (!userRole) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          // Parse the JWT or verify against your custom auth (simplified here)
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          userRole = tokenData.role;
        } catch (error) {
          console.error('Error parsing auth token:', error);
        }
      }
      
      // Fallback: check if we can extract user info from cookies or other headers
      // This is a simplified approach - in production, properly validate these claims
      const userHeader = request.headers.get('x-user-role');
      if (userHeader) {
        userRole = userHeader;
      }
      
      // Development fallback - REMOVE IN PRODUCTION
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development fallback for authentication');
        userRole = 'ADMIN';
      }
    }

    console.log('User role determined from auth:', userRole);
    
    // Only admin can view all users
    console.log("userRole", userRole);
    if (!userRole || userRole !== 'ADMIN') {
      
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Only admins can view all users',
        },
        { status: 403 }
      );
    }

    // Get data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'A2:G', // Read from row 2 to end, columns A to G
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // Convert sheet data to user list
    // [Name, Email, Registration time, Password, Role, Phone number, Address]
    const users = rows.map((row, index) => ({
      id: index.toString(), // Use index as ID
      fullName: row[0] || '',
      email: row[1] || '',
      registrationTime: row[2] || '',
      role: row[4] || 'customer',
      phoneNumber: row[5] || '',
      address: row[6] || '',
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 