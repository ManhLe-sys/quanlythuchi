import { NextResponse, NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email, order } = await request.json();

    if (!email || !order) {
      return NextResponse.json(
        { error: 'Email and order information are required' },
        { status: 400 }
      );
    }

    // Set up transporter with explicit credentials
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'manhlh1.qn@gmail.com',
        pass: 'pbbh wecf yirs pimf',
      },
      tls: {
        rejectUnauthorized: false // Helps avoid certificate issues
      }
    });

    // Format the item list in HTML
    const itemsHtml = order.items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eaeaea;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eaeaea; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eaeaea; text-align: right;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eaeaea; text-align: right;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal)}</td>
      </tr>
    `).join('');

    // Format the invoice number using timestamp
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    const orderDate = new Date().toLocaleDateString('vi-VN');

    // Create email content
    const mailOptions = {
      from: `"Quản lý Thu Chi" <manhlh1.qn@gmail.com>`,
      to: email,
      subject: `Xác nhận đơn hàng #${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <div style="background-color: #3E503C; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Xác Nhận Đơn Hàng</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Kính gửi <strong>${order.customerInfo.fullName}</strong>,</p>
            <p>Cảm ơn bạn đã đặt hàng. Dưới đây là thông tin chi tiết đơn hàng của bạn:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Mã đơn hàng:</strong> ${invoiceNumber}</p>
              <p><strong>Ngày đặt hàng:</strong> ${orderDate}</p>
              <p><strong>Phương thức thanh toán:</strong> ${order.customerInfo.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}</p>
            </div>
            
            <h2 style="font-size: 18px; color: #3E503C; margin-top: 30px;">Chi Tiết Đơn Hàng</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left;">Sản phẩm</th>
                  <th style="padding: 12px; text-align: center;">Số lượng</th>
                  <th style="padding: 12px; text-align: right;">Đơn giá</th>
                  <th style="padding: 12px; text-align: right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Tổng cộng:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; color: #3E503C;">
                    ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
            
            <h2 style="font-size: 18px; color: #3E503C; margin-top: 30px;">Thông Tin Giao Hàng</h2>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
              <p><strong>Họ tên:</strong> ${order.customerInfo.fullName}</p>
              <p><strong>Địa chỉ:</strong> ${order.customerInfo.address}</p>
              <p><strong>Số điện thoại:</strong> ${order.customerInfo.phone}</p>
              <p><strong>Email:</strong> ${order.customerInfo.email}</p>
            </div>
            
            ${order.customerInfo.paymentMethod === 'banking' ? `
            <h2 style="font-size: 18px; color: #3E503C; margin-top: 30px;">Thông Tin Thanh Toán</h2>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
              <p>Nếu bạn chưa thanh toán, vui lòng chuyển khoản theo thông tin sau:</p>
              <p><strong>Ngân hàng:</strong> BIDV</p>
              <p><strong>Số tài khoản:</strong> 1234567890</p>
              <p><strong>Chủ tài khoản:</strong> Nguyễn Văn A</p>
              <p><strong>Nội dung chuyển khoản:</strong> ${invoiceNumber}</p>
            </div>
            ` : ''}
            
            <p style="margin-top: 30px;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
            <p>Trân trọng,<br>Đội ngũ Quản lý Thu Chi</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
            <p>&copy; 2023 Quản lý Thu Chi. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      `,
    };

    console.log('Attempting to send email to:', email);
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error },
      { status: 500 }
    );
  }
} 