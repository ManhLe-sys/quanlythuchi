import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { SHEETS } from '@/lib/sheets';

// Initialize Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_SHEET_ID) {
  throw new Error('Missing required Google Sheets credentials in environment variables');
}

const jwt = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, jwt);

// Initialize Google Sheets
const initializeSheet = async () => {
  try {
    console.log('Loading spreadsheet...');
    await doc.loadInfo();
    console.log('Spreadsheet loaded:', doc.title);
    
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
    
    return sheet;
  } catch (error) {
    console.error('Error initializing sheet:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('Received POST request');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { session_id, user_id, type, start_time, duration, note } = body;
    
    console.log('Initializing sheet...');
    const sheet = await initializeSheet();
    
    // Check for existing sessions with the same start time and type
    const rows = await sheet.getRows();
    const isDuplicate = rows.some(row => 
      row.get('start_time') === start_time && 
      row.get('type') === type
    );

    if (isDuplicate) {
      console.log('Duplicate session detected, skipping...');
      return NextResponse.json({ 
        success: false,
        error: 'Duplicate session',
        details: 'A session with the same start time and type already exists'
      });
    }
    
    console.log('Adding new row...');
    // Add the new session to the sheet
    await sheet.addRow({
      session_id,
      user_id,
      type,
      start_time,
      duration,
      note
    });
    console.log('Row added successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging Pomodoro session:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Received GET request');
    const sheet = await initializeSheet();
    console.log('Getting rows...');
    const rows = await sheet.getRows();
    
    const sessions = rows.map(row => ({
      session_id: row.get('session_id'),
      user_id: row.get('user_id'),
      type: row.get('type'),
      start_time: row.get('start_time'),
      duration: parseInt(row.get('duration')),
      note: row.get('note')
    }));

    console.log(`Found ${sessions.length} sessions`);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching Pomodoro sessions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 