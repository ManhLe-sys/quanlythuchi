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
    
    console.log('User role for user creation:', userRole);
    
    // Only admin can create users (especially other admins)
    if (userRole !== 'admin' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can create users' },
        { status: 403 }
      );
    }

    // Get the request body
    const { fullName, email, role, phoneNumber, address } = await request.json();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate role
    const validRole = role || 'customer';
    if (!['admin', 'ADMIN', 'STAFF', 'staff', 'customer'].includes(validRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'B2:B', // Just check email column
    });

    const rows = response.data.values || [];
    const emailExists = rows.some(row => row[0] === email);
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Generate default password and hash it
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Create timestamp
    const registrationTime = new Date().toLocaleString('vi-VN');

    // Create a new user
    const values = [
      [
        fullName,
        email,
        registrationTime,
        hashedPassword,
        validRole,
        phoneNumber || "",
        address || "",
      ],
    ];

    // Append the new user to the spreadsheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'A2:G',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      data: {
        fullName,
        email,
        role: validRole,
        phoneNumber: phoneNumber || '',
        address: address || ''
      } 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 