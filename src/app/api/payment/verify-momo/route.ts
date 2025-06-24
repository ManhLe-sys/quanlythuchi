import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Khởi tạo Google Sheets API
const auth = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ID của Google Spreadsheet
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SHEET_ID;

// Tên sheet đơn hàng
const DON_HANG_SHEET = 'Đơn hàng';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // MoMo Configuration
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    
    // Extract data from the request
    const { 
      partnerCode: receivedPartnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature: receivedSignature
    } = body;
    
    // Verify the partnerCode
    if (receivedPartnerCode !== partnerCode) {
      return NextResponse.json({ message: "Invalid partner code" }, { status: 400 });
    }
    
    // Create the raw signature string for verification
    const rawSignature = 
      "accessKey=" + accessKey +
      "&amount=" + amount +
      "&extraData=" + extraData +
      "&message=" + message +
      "&orderId=" + orderId +
      "&orderInfo=" + orderInfo +
      "&orderType=" + orderType +
      "&partnerCode=" + receivedPartnerCode +
      "&payType=" + payType +
      "&requestId=" + requestId +
      "&responseTime=" + responseTime +
      "&resultCode=" + resultCode +
      "&transId=" + transId;
    
    // Generate the signature for verification
    const signature = crypto.createHmac('sha256', secretkey)
      .update(rawSignature)
      .digest('hex');
    
    // Verify the signature
    if (signature !== receivedSignature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }
    
    // Check if payment was successful
    if (resultCode === '0') {
      // Update order status in the database
      try {
        // 1. Get all orders from the sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${DON_HANG_SHEET}!A:P`,
        });
        
        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
          throw new Error('No orders found');
        }
        
        // 2. Find the row with matching order ID
        let foundRowIndex = -1;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][1] === orderId) { // Index 1 is the ma_don column
            foundRowIndex = i;
            break;
          }
        }
        
        if (foundRowIndex === -1) {
          throw new Error(`Order ${orderId} not found`);
        }
        
        // 3. Update the order payment status
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${DON_HANG_SHEET}!J${foundRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Đã thanh toán']]
          },
        });
        
        // 4. Update the last updated timestamp
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${DON_HANG_SHEET}!O${foundRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[new Date().toISOString()]]
          },
        });
        
      } catch (dbError) {
        console.error('Error updating order status:', dbError);
        // Still return success to MoMo, but log the error
      }
      
      return NextResponse.json({ 
        message: "Payment verification successful",
        orderId,
        transId,
        amount
      });
    } else {
      return NextResponse.json({
        message: "Payment failed",
        resultCode,
        orderId
      }, { status: 400 });
    }
  } catch (error) {
    console.error('MoMo verification error:', error);
    return NextResponse.json({ error: 'Failed to verify MoMo payment' }, { status: 500 });
  }
} 