import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// A simple in-memory reservation system
// In a production app, this would be stored in a database
interface Reservation {
  productId: string;
  userId: string;
  quantity: number;
  timestamp: number; // For expiring old reservations
}

// Global store for reservations - will reset on server restart
// In production, use Redis, a database, or other persistent storage
let reservations: Reservation[] = [];

// Reservations expire after 30 minutes (in ms)
const RESERVATION_TIMEOUT = 30 * 60 * 1000;

// Clean up expired reservations periodically
function cleanupExpiredReservations() {
  const now = Date.now();
  reservations = reservations.filter(res => 
    now - res.timestamp < RESERVATION_TIMEOUT
  );
}

// Get total reserved quantity for a product
function getReservedQuantity(productId: string): number {
  cleanupExpiredReservations();
  return reservations
    .filter(res => res.productId === productId)
    .reduce((total, res) => total + res.quantity, 0);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, userId, quantity, action } = body;
    
    if (!productId || !userId) {
      return NextResponse.json(
        { error: 'productId và userId là bắt buộc' },
        { status: 400 }
      );
    }

    // Get current product stock from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: 'Menu!A2:I',
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json(
        { error: 'Không tìm thấy dữ liệu sản phẩm' },
        { status: 404 }
      );
    }

    // Find the product
    const productRow = rows.find(row => row[0] === productId);
    if (!productRow) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    const availableQuantity = Number(productRow[8] || 0);
    let reservedQuantity = getReservedQuantity(productId);
    
    // Handle the different actions
    if (action === 'reserve') {
      // Check if user already has this product reserved
      const existingReservation = reservations.find(
        res => res.productId === productId && res.userId === userId
      );

      if (existingReservation) {
        // Update existing reservation
        const additionalQuantity = quantity - existingReservation.quantity;
        
        // Check if we have enough stock for the additional quantity
        if (availableQuantity - reservedQuantity <= additionalQuantity) {
          // Special case: If exactly the amount is available, allow it
          if (availableQuantity - reservedQuantity === additionalQuantity && additionalQuantity > 0) {
            // Allow exact quantity match
            existingReservation.quantity = quantity;
            existingReservation.timestamp = Date.now();
            
            // Recalculate reserved quantity
            reservedQuantity = getReservedQuantity(productId);
            
            return NextResponse.json({
              success: true,
              availableQuantity,
              reservedQuantity,
              actualAvailable: availableQuantity - reservedQuantity
            });
          }
          
          return NextResponse.json(
            { 
              success: false,
              availableQuantity,
              reservedQuantity,
              actualAvailable: availableQuantity - reservedQuantity,
              requestedQuantity: quantity,
              error: 'Số lượng không đủ' 
            },
            { status: 200 }
          );
        }
        
        // Update reservation
        existingReservation.quantity = quantity;
        existingReservation.timestamp = Date.now();
      } else {
        // Create new reservation
        if (availableQuantity - reservedQuantity <= quantity) {
          // Special case: If exactly the amount is available, allow it
          if (availableQuantity - reservedQuantity === quantity && quantity > 0) {
            // Add new reservation
            reservations.push({
              productId,
              userId,
              quantity,
              timestamp: Date.now()
            });
            
            // Recalculate reserved quantity
            reservedQuantity = getReservedQuantity(productId);
            
            return NextResponse.json({
              success: true,
              availableQuantity,
              reservedQuantity,
              actualAvailable: availableQuantity - reservedQuantity
            });
          }
          
          return NextResponse.json(
            { 
              success: false,
              availableQuantity,
              reservedQuantity,
              actualAvailable: availableQuantity - reservedQuantity,
              requestedQuantity: quantity,
              error: 'Số lượng không đủ' 
            },
            { status: 200 }
          );
        }
        
        // Add new reservation
        reservations.push({
          productId,
          userId,
          quantity,
          timestamp: Date.now()
        });
      }
      
      // Recalculate total reserved quantity
      reservedQuantity = getReservedQuantity(productId);
      
      return NextResponse.json({
        success: true,
        availableQuantity,
        reservedQuantity,
        actualAvailable: availableQuantity - reservedQuantity
      });
    } 
    else if (action === 'release') {
      // Remove the reservation for this user and product
      reservations = reservations.filter(
        res => !(res.productId === productId && res.userId === userId)
      );
      
      // Recalculate total reserved quantity
      reservedQuantity = getReservedQuantity(productId);
      
      return NextResponse.json({
        success: true,
        availableQuantity,
        reservedQuantity,
        actualAvailable: availableQuantity - reservedQuantity
      });
    }
    else if (action === 'check') {
      // Just check availability without changing reservations
      return NextResponse.json({
        success: true,
        availableQuantity,
        reservedQuantity,
        actualAvailable: availableQuantity - reservedQuantity,
        hasEnough: availableQuantity - reservedQuantity >= quantity
      });
    }
    else {
      return NextResponse.json(
        { error: 'Thao tác không hợp lệ' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error checking stock:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kiểm tra tồn kho' },
      { status: 500 }
    );
  }
} 