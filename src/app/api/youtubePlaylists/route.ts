import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

const SHEET_NAME = 'YouTubePlaylists';

async function getSheet() {
  if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_SHEET_ID) {
    throw new Error('Missing Google Sheets credentials');
  }
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  let sheet = doc.sheetsByTitle[SHEET_NAME];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: SHEET_NAME,
      headerValues: ['id', 'name', 'description', 'videoIds', 'createdBy', 'createdAt', 'updatedAt'],
    });
  }
  return sheet;
}

export async function GET(req: NextRequest) {
  try {
    const sheet = await getSheet();
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const { searchParams } = new URL(req.url);
    const createdBy = searchParams.get('createdBy');
    let playlists = rows.map(row => ({
      id: row.get('id'),
      name: row.get('name'),
      description: row.get('description'),
      videoIds: row.get('videoIds'),
      createdBy: row.get('createdBy'),
      createdAt: row.get('createdAt'),
      updatedAt: row.get('updatedAt'),
    }));
    if (createdBy) {
      playlists = playlists.filter(pl => pl.createdBy === createdBy);
    }
    return NextResponse.json({ playlists });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email || '';
    const { name, description, createdBy } = await req.json();
    if (!name) return NextResponse.json({ error: 'Thiếu tên playlist' }, { status: 400 });
    const sheet = await getSheet();
    const now = new Date().toISOString();
    const playlist = {
      id: uuidv4(),
      name,
      description: description || '',
      videoIds: '',
      createdBy: createdBy || sessionEmail,
      createdAt: now,
      updatedAt: now,
    };
    await sheet.addRow(playlist);
    return NextResponse.json({ playlist });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu id playlist' }, { status: 400 });
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === id);
    if (!row) return NextResponse.json({ error: 'Không tìm thấy playlist' }, { status: 404 });
    await row.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
} 