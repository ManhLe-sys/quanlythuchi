import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import { DefaultSession } from 'next-auth';

// Extend the built-in User type
declare module "next-auth" {
  interface User {
    role?: string;
    accessToken?: string;
  }
  interface Session {
    user: {
      role?: string;
      accessToken?: string;
    } & DefaultSession["user"];
  }
  interface JWT {
    role?: string;
    accessToken?: string;
  }
}

// Khởi tạo Google Sheets API
const sheets = google.sheets('v4');
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Users';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Xác thực với Google Sheets API
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });

          // Lấy dữ liệu từ sheet
          const response = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:E`,
          });

          const rows = response.data.values || [];
          
          // Tìm user theo email
          const user = rows.find((row) => row[2] === credentials.email);
          if (!user) {
            return null;
          }

          // So sánh mật khẩu
          const isValid = await bcrypt.compare(credentials.password, user[3]);
          if (!isValid) {
            return null;
          }

          return {
            id: user[0],
            name: user[1],
            email: user[2],
            role: user[4],
          };
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}; 