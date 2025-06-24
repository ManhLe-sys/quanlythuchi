import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Initialize Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
  throw new Error('Missing required Google Sheets credentials in environment variables');
}

const jwt = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
  scopes: SCOPES,
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);

// GET handler
export async function GET() {
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Get the first sheet
    const rows = await sheet.getRows();

    const events = rows.map(row => ({
      id: row.get('id'),
      date: row.get('date'),
      start_time: row.get('start_time'),
      end_time: row.get('end_time'),
      title: row.get('title'),
      description: row.get('description'),
      location: row.get('location'),
      created_by: row.get('created_by'),
      last_updated_at: row.get('last_updated_at')
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    const newRow = {
      id: Date.now().toString(),
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      title: body.title,
      description: body.description || '',
      location: body.location || '',
      created_by: body.created_by || 'system',
      last_updated_at: new Date().toISOString()
    };

    await sheet.addRow(newRow);

    return NextResponse.json(newRow);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// PUT handler
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const rowToUpdate = rows.find(row => row.get('id') === body.id);
    if (!rowToUpdate) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    rowToUpdate.set('date', body.date);
    rowToUpdate.set('start_time', body.start_time);
    rowToUpdate.set('end_time', body.end_time);
    rowToUpdate.set('title', body.title);
    rowToUpdate.set('description', body.description || '');
    rowToUpdate.set('location', body.location || '');
    rowToUpdate.set('last_updated_at', new Date().toISOString());

    await rowToUpdate.save();

    return NextResponse.json({
      id: rowToUpdate.get('id'),
      date: rowToUpdate.get('date'),
      start_time: rowToUpdate.get('start_time'),
      end_time: rowToUpdate.get('end_time'),
      title: rowToUpdate.get('title'),
      description: rowToUpdate.get('description'),
      location: rowToUpdate.get('location'),
      created_by: rowToUpdate.get('created_by'),
      last_updated_at: rowToUpdate.get('last_updated_at')
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const rowToDelete = rows.find(row => row.get('id') === id);
    if (!rowToDelete) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    await rowToDelete.delete();

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 