import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { appendToSheet, getSheetValues } from "@/lib/google-sheets";

const SHEET_NAME = "YouTubePlaylists";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return new NextResponse('Playlist name is required', { status: 400 });
    }

    const playlistId = `playlist_${Date.now()}`;
    const now = new Date().toISOString();

    await appendToSheet('YouTubePlaylists', [
      [playlistId, name.trim(), session.user.email, now]
    ]);

    return NextResponse.json({
      playlist_id: playlistId,
      playlist_name: name.trim(),
      owner: session.user.email,
      created_at: now,
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const rows = await getSheetValues('YouTubePlaylists');
    if (!rows) {
      return NextResponse.json([]);
    }

    const playlists = rows.slice(1).map(row => ({
      playlist_id: row[0],
      playlist_name: row[1],
      owner: row[2],
      created_at: row[3],
    })).filter(playlist => playlist.owner === session.user.email);

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 