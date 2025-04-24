import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
      // Update your order status in the database here
      // Example: await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'Đã thanh toán' } });
      
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