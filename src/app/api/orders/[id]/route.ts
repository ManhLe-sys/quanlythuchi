import { NextRequest, NextResponse } from 'next/server';
import { getOrderDetails } from '@/lib/orders';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderDetails = await getOrderDetails(id);

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