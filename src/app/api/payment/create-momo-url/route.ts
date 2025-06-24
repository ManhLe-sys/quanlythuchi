import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, orderInfo, orderId } = body;

    // MoMo Configuration
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const requestId = partnerCode + new Date().getTime();
    const redirectUrl = process.env.NEXT_PUBLIC_BASE_URL + "/payment/momo-return" || "https://momo.vn/return";
    const ipnUrl = process.env.NEXT_PUBLIC_BASE_URL + "/api/payment/verify-momo" || "https://callback.url/notify";
    const requestType = "captureWallet";
    const extraData = "";

    // Create raw signature
    const rawSignature = 
      "accessKey=" + accessKey + 
      "&amount=" + amount + 
      "&extraData=" + extraData + 
      "&ipnUrl=" + ipnUrl + 
      "&orderId=" + orderId + 
      "&orderInfo=" + orderInfo + 
      "&partnerCode=" + partnerCode + 
      "&redirectUrl=" + redirectUrl + 
      "&requestId=" + requestId + 
      "&requestType=" + requestType;

    // Create signature
    const signature = crypto.createHmac('sha256', secretkey)
      .update(rawSignature)
      .digest('hex');

    // Prepare request body
    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: amount.toString(),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi'
    };

    // Call the MoMo API
    const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('MoMo payment error:', error);
    return NextResponse.json({ error: 'Failed to create MoMo payment URL' }, { status: 500 });
  }
} 