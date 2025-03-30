import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import { DefaultSession } from 'next-auth';

// Extend the built-in User type
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }
  interface JWT {
    role?: string;
  }
}

// Khởi tạo Google Sheets API
const sheets = google.sheets('v4');
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Users';

export const authOptions: NextAuthOptions = {
  providers: [
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
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        console.log('JWT callback - user role:', user.role); // Debug log
      }
      console.log('JWT callback - token:', token); // Debug log
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = typeof token.role === 'string' ? token.role : undefined;
        console.log('Session callback - user role:', session.user.role); // Debug log
      }
      console.log('Session callback - session:', session); // Debug log
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 