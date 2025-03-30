import { NextResponse } from 'next/server';
import { createNewOrder, getMenuItems, getCategories, getOrders } from '@/lib/orders';

export async function GET() {
  try {
    // Lấy danh sách menu và danh mục để hiển thị trong form
    const [menuItems, categories] = await Promise.all([
      getMenuItems(),
      getCategories(),
    ]);

    // Lấy danh sách đơn hàng
    const orders = await getOrders(menuItems);

    return NextResponse.json({
      success: true,
      data: {
        menuItems,
        categories,
        orders,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Có lỗi xảy ra khi lấy dữ liệu',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    const result = await createNewOrder(orderData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        ma_don: result.ma_don,
      },
    });
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Có lỗi xảy ra khi tạo đơn hàng',
      },
      { status: 500 }
    );
  }
} 