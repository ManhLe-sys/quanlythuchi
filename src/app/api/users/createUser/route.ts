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

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the request body
    const { name, email, password, role, phoneNumber, address } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate role
    const validRole = role || 'customer';
    if (!['admin', 'STAFF', 'customer'].includes(validRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Kiểm tra email đã tồn tại chưa
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'A2:E',
    });

    const rows = response.data.values || [];
    const existingUser = rows.find(row => row[1] === email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Generate default password (can be changed later)
    const defaultPassword = 'password123';
    
    // Create timestamp
    const registrationTime = new Date().toISOString();

    // Create a new user
    const values = [
      [
        name,
        email,
        registrationTime,
        defaultPassword,
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
        name,
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