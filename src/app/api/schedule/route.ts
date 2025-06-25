import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

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
  await doc.loadInfo();
  
  let sheet = doc.sheetsByTitle['Schedule'];
  
  if (!sheet) {
    // If Schedule sheet doesn't exist, create it
    sheet = await doc.addSheet({
      title: 'Schedule',
      headerValues: [
        'id',
        'date',
        'start_time',
        'end_time',
        'title',
        'description',
        'location',
        'created_by',
        'last_updated_at'
      ]
    });
  }
  
  return sheet;
};

// GET handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date');
    
    const sheet = await initializeSheet();
    await sheet.loadCells();
    const rows = await sheet.getRows();

    const events = rows.map(row => {
      // Ensure all required fields are present
      const event = {
        id: row.get('id') || String(Date.now()),
        title: row.get('title') || '',
        date: row.get('date') || '',
        start_time: row.get('start_time') || '00:00',
        end_time: row.get('end_time') || '00:00',
        description: row.get('description') || '',
        location: row.get('location') || '',
        created_by: row.get('created_by') || 'system',
        last_updated_at: row.get('last_updated_at') || new Date().toISOString()
      };

      // Only return events with valid required fields
      if (!event.id || !event.date || !event.title) {
        console.warn('Skipping invalid event:', event);
        return null;
      }

      return event;
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
    .filter(event => !dateFilter || event.date === dateFilter);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sheet = await initializeSheet();

    // Validate required fields
    if (!body.title || !body.date || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newEvent = {
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

    // Add the new row
    await sheet.addRow(newEvent);

    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT handler
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const sheet = await initializeSheet();
    const rows = await sheet.getRows();

    const rowToUpdate = rows.find(row => row.get('id') === body.id);
    if (!rowToUpdate) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update all fields
    rowToUpdate.set('date', body.date);
    rowToUpdate.set('start_time', body.start_time);
    rowToUpdate.set('end_time', body.end_time);
    rowToUpdate.set('title', body.title);
    rowToUpdate.set('description', body.description || '');
    rowToUpdate.set('location', body.location || '');
    rowToUpdate.set('last_updated_at', new Date().toISOString());

    await rowToUpdate.save();

    const updatedEvent = {
      id: rowToUpdate.get('id'),
      date: rowToUpdate.get('date'),
      start_time: rowToUpdate.get('start_time'),
      end_time: rowToUpdate.get('end_time'),
      title: rowToUpdate.get('title'),
      description: rowToUpdate.get('description'),
      location: rowToUpdate.get('location'),
      created_by: rowToUpdate.get('created_by'),
      last_updated_at: rowToUpdate.get('last_updated_at')
    };

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const sheet = await initializeSheet();
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
      { error: 'Failed to delete event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 