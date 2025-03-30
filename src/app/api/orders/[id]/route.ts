import { NextResponse } from 'next/server';
import { getOrderDetails } from '@/lib/orders';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const orderDetails = await getOrderDetails(orderId);

    return NextResponse.json({
      success: true,
      data: {
        orderDetails,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Có lỗi xảy ra khi lấy chi tiết đơn hàng',
      },
      { status: 500 }
    );
  }
} 