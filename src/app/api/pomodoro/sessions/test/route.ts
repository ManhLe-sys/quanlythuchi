import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { SHEETS } from '@/lib/sheets';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

export async function GET() {
  try {
    console.log('Testing Google Sheets connection...');
    
    // Log environment variables (without sensitive data)
    console.log('Environment check:', {
      hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      hasSheetId: !!process.env.GOOGLE_SHEETS_SHEET_ID,
    });

    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_SHEET_ID) {
      throw new Error('Missing required Google Sheets credentials in environment variables');
    }

    const jwt = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    console.log('JWT created successfully');

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, jwt);
    await doc.loadInfo();
    
    console.log('Spreadsheet loaded:', doc.title);
    console.log('Available sheets:', doc.sheetsByTitle);

    // Try to access or create PomodoroSessions sheet
    let sheet = doc.sheetsByTitle[SHEETS.POMODORO_SESSIONS];
    
    if (!sheet) {
      console.log('Creating PomodoroSessions sheet...');
      sheet = await doc.addSheet({
        title: SHEETS.POMODORO_SESSIONS,
        headerValues: [
          'session_id',
          'user_id',
          'type',
          'start_time',
          'duration',
          'note'
        ]
      });
      console.log('Sheet created successfully');
    } else {
      console.log('PomodoroSessions sheet exists');
    }

    // Try to add a test row
    await sheet.addRow({
      session_id: 'test-' + Date.now(),
      user_id: 'test-user',
      type: 'test',
      start_time: new Date().toISOString(),
      duration: 1,
      note: 'Test entry'
    });

    console.log('Test row added successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Test completed successfully',
      sheetTitle: doc.title,
      availableSheets: Object.keys(doc.sheetsByTitle)
    });

  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error
    }, { status: 500 });
  }
} 