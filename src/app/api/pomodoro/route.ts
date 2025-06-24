import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const getAuthClient = () => {
  return new JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
};

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();
    const auth = getAuthClient();
    const sheets = google.sheets('v4');

    switch (action) {
      case 'logSession':
        const values = [
          [
            data.session_id,
            data.user_id || '',
            data.start_time,
            data.end_time,
            data.duration,
            data.status,
            data.notes || '',
            data.cycle_number,
          ],
        ];

        await sheets.spreadsheets.values.append({
          auth,
          spreadsheetId: SPREADSHEET_ID,
          range: 'PomodoroLogs!A:H',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
        break;

      case 'getLogs':
        const response = await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId: SPREADSHEET_ID,
          range: 'PomodoroLogs!A:H',
        });

        let logs = response.data.values?.map(row => ({
          session_id: row[0],
          user_id: row[1],
          start_time: row[2],
          end_time: row[3],
          duration: parseInt(row[4]),
          status: row[5],
          notes: row[6],
          cycle_number: parseInt(row[7]),
        })) || [];

        if (data.userId) {
          logs = logs.filter(log => log.user_id === data.userId);
        }

        return NextResponse.json({ logs: logs.slice(-10) });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pomodoro API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 