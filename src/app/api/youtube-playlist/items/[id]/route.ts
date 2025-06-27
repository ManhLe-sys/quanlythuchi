import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/authOptions";
import { getSheetData, updateSheetRow } from "@/lib/sheets";

const SHEET_NAME = "YouTubePlaylistItems";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;

    // Get all data to find the row index
    const data = await getSheetData(SHEET_NAME);
    const rowIndex = data.findIndex(
      (row) => row[0] === itemId && row[3] === session.user?.email
    );

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Playlist item not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the row with empty values (soft delete)
    await updateSheetRow(SHEET_NAME, rowIndex + 1, ["", "", "", "", ""]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting playlist item:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist item" },
      { status: 500 }
    );
  }
} 