import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'YouTubePlaylistItems';

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
      headerValues: ['item_id', 'playlist_id', 'youtube_url', 'added_at', 'title'],
    });
  }
  return sheet;
}

export async function POST(req: NextRequest) {
  try {
    const { playlist_id, youtube_url, title } = await req.json();
    if (!playlist_id || !youtube_url) return NextResponse.json({ error: 'Thiếu playlist_id hoặc youtube_url' }, { status: 400 });
    const sheet = await getSheet();
    const now = new Date().toISOString();
    const item = {
      item_id: uuidv4() + '_' + Date.now(),
      playlist_id,
      youtube_url,
      added_at: now,
      title: title || '',
    };
    await sheet.addRow(item);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playlist_id = searchParams.get('playlist_id');
    if (!playlist_id) return NextResponse.json({ items: [] });
    const sheet = await getSheet();
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const items = rows
      .filter(row => row.get('playlist_id') === playlist_id)
      .map(row => ({
        item_id: row.get('item_id'),
        playlist_id: row.get('playlist_id'),
        youtube_url: row.get('youtube_url'),
        added_at: row.get('added_at'),
        title: row.get('title'),
      }));
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
} 