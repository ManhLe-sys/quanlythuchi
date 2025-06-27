import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Initialize auth client
const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

export const SHEETS = {
  DON_HANG: 'Đơn hàng',
  DANH_MUC: 'Danh mục',
  POMODORO_SESSIONS: 'PomodoroSessions',
  YOUTUBE_PLAYLISTS: 'YouTubePlaylists',
  YOUTUBE_PLAYLIST_ITEMS: 'YouTubePlaylistItems',
} as const;

export async function appendToSheet(sheetName: string, values: any[][]) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}

export async function getSheetData(sheetName: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:D`,
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Error getting sheet data:', error);
    throw error;
  }
}

export async function updateSheetRow(sheetName: string, rowIndex: number, values: any[]) {
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A${rowIndex}:D${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating sheet row:', error);
    throw error;
  }
}

export async function deleteSheetRow(sheetName: string, rowIndex: number) {
  try {
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting sheet row:', error);
    throw error;
  }
} 