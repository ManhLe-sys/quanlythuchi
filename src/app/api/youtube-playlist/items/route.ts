import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { appendToSheet, getSheetData } from "@/lib/sheets";

const SHEET_NAME = "YouTubePlaylistItems";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { playlist_id, youtube_url } = await request.json();

    if (!playlist_id || !youtube_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify playlist ownership
    const playlistsData = await getSheetData("YouTubePlaylists");
    const playlist = playlistsData
      .slice(1)
      .find(row => row[0] === playlist_id && row[2] === session.user?.email);

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found or unauthorized" },
        { status: 404 }
      );
    }

    // Add new playlist item
    const newRow = [
      Date.now().toString(), // item_id
      playlist_id,
      youtube_url,
      session.user?.email || '', // owner
      new Date().toISOString(), // added_at
    ];

    await appendToSheet(SHEET_NAME, [newRow]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding playlist item:", error);
    return NextResponse.json(
      { error: "Failed to add playlist item" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const playlist_id = searchParams.get("playlist_id");

    if (!playlist_id) {
      return NextResponse.json(
        { error: "Playlist ID is required" },
        { status: 400 }
      );
    }

    // Verify playlist ownership
    const playlistsData = await getSheetData("YouTubePlaylists");
    const playlist = playlistsData
      .slice(1)
      .find(row => row[0] === playlist_id && row[2] === session.user?.email);

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get playlist items
    const data = await getSheetData(SHEET_NAME);
    const items = data
      .slice(1) // Skip header row
      .filter((row) => row[1] === playlist_id && row[3] === session.user?.email) // Filter by playlist_id and owner
      .map((row) => ({
        item_id: row[0],
        playlist_id: row[1],
        youtube_url: row[2],
        owner: row[3],
        added_at: row[4],
      }));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error getting playlist items:", error);
    return NextResponse.json(
      { error: "Failed to get playlist items" },
      { status: 500 }
    );
  }
} 