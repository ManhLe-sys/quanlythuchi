import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { google } from 'googleapis';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_API_KEY });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // Get all playlists
    const playlistsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'YouTubePlaylists',
    });

    const playlists = playlistsResponse.data.values || [];
    const playlistIndex = playlists.findIndex(row => row[0] === params.id);

    if (playlistIndex === -1) {
      return new NextResponse('Playlist not found', { status: 404 });
    }

    // Check if user owns the playlist
    if (playlists[playlistIndex][2] !== session.user.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Delete playlist items first
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `YouTubePlaylistItems!A${playlistIndex + 2}:D${playlistIndex + 2}`,
    });

    // Then delete the playlist
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `YouTubePlaylists!A${playlistIndex + 2}:D${playlistIndex + 2}`,
    });

    return new NextResponse('Playlist deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 