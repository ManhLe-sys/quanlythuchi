# Quản Lý Thu Chi - Hướng Dẫn Sử Dụng và Tài Liệu Kỹ Thuật

## Giới thiệu

Quản Lý Thu Chi là một ứng dụng web hiện đại được phát triển bằng Next.js, giúp người dùng quản lý thu nhập, chi tiêu, và theo dõi tài chính cá nhân hoặc doanh nghiệp. Hệ thống cung cấp giao diện trực quan với các tính năng phong phú như quản lý thu chi, báo cáo, quản lý sản phẩm, và tích hợp thanh toán.

## Cấu trúc dự án

Dự án được xây dựng dựa trên Next.js 15 với App Router và có cấu trúc thư mục như sau:

```
quanlythuchi/
├── .next/               # Thư mục build của Next.js
├── node_modules/        # Dependencies
├── prisma/              # Schema và migrations của Prisma
├── public/              # Tài nguyên tĩnh
├── src/                 # Mã nguồn chính
│   ├── app/             # App Router của Next.js
│   │   ├── api/         # API Routes
│   │   ├── (dashboard)/ # Các trang dashboard (route group)
│   │   ├── expense/     # Trang quản lý chi tiêu
│   │   ├── income/      # Trang quản lý thu nhập
│   │   ├── reports/     # Trang báo cáo
│   │   ├── products/    # Trang quản lý sản phẩm
│   │   ├── orders/      # Trang quản lý đơn hàng
│   │   ├── auth/        # Xác thực người dùng
│   │   ├── page.tsx     # Trang chính
│   │   └── layout.tsx   # Layout chính
│   ├── components/      # Components tái sử dụng
│   │   └── ui/          # UI components 
│   ├── lib/             # Utilities và helpers
│   ├── types/           # TypeScript type definitions
│   └── core/            # Core business logic
├── .env                 # Environment variables
├── .env.local           # Local environment variables
├── package.json         # Dependencies và scripts
└── tsconfig.json        # TypeScript configuration
```

## Công nghệ sử dụng

### Frontend
- **Next.js 15**: Framework React với App Router
- **React 19**: Thư viện UI
- **TailwindCSS 4**: CSS utility framework
- **Radix UI**: Unstyled accessible components
- **Lucide React**: Icon library
- **React Hook Form**: Form handling
- **Chart.js/Recharts**: Visualization libraries
- **React Query**: Data fetching and caching

### Backend
- **Next.js API Routes**: API endpoints
- **Prisma ORM**: Database ORM
- **NextAuth.js**: Authentication
- **Zod**: Schema validation
- **JWT**: Token-based authentication

### Database
- **Prisma Client**: TypeScript ORM
- **Database service**: (MongoDB/PostgreSQL/MySQL dựa trên cấu hình Prisma)

## Cơ chế hoạt động

### 1. Xác thực người dùng
- Hệ thống sử dụng NextAuth.js để xác thực người dùng
- Đăng nhập/đăng ký thông qua JWT với mã hóa bcrypt cho mật khẩu
- Quản lý phiên và quyền truy cập

### 2. Quản lý dữ liệu thu chi
- Mô hình dữ liệu với Prisma schema
- Nhập liệu thu/chi với phân loại và mô tả chi tiết
- Hỗ trợ tệp đính kèm và metadata cho mỗi giao dịch

### 3. Báo cáo và thống kê
- Tổng hợp dữ liệu thu chi theo nhiều tiêu chí
- Biểu đồ trực quan với Chart.js và Recharts
- Xuất báo cáo dạng PDF hoặc Excel

### 4. Tích hợp thanh toán
- Hỗ trợ thanh toán qua MoMo và các cổng khác
- Xử lý callback và cập nhật trạng thái giao dịch
- Lưu trữ lịch sử thanh toán

### 5. Quản lý sản phẩm/dịch vụ
- Thêm, sửa, xóa thông tin sản phẩm
- Quản lý tồn kho
- Liên kết với giao dịch thu chi

## Hướng dẫn cài đặt

1. Clone repository
```bash
git clone <repository-url>
cd quanlythuchi
```

2. Cài đặt dependencies
```bash
npm install
```

3. Thiết lập biến môi trường
- Tạo file `.env.local` từ `.env.example`
- Cập nhật các thông tin cấu hình cần thiết

4. Migrate database với Prisma
```bash
npx prisma db push
```

5. Chạy ứng dụng
```bash
npm run dev
```

6. Truy cập ứng dụng tại `http://localhost:3000`

## Lưu ý quan trọng về giao diện

1. **Nút (Button)**: 
   - Các nút trong ứng dụng KHÔNG được sử dụng nền đen
   - Luôn sử dụng màu sắc phù hợp với ngữ cảnh (primary, secondary, accent)

2. **Text**: 
   - Sử dụng text-gray-700 cho các văn bản chính
   - Đảm bảo độ tương phản và khả năng đọc

## API và Endpoints

Dự án cung cấp các API endpoints cho các tính năng chính:

1. **Authentication**
   - `/api/auth/register` - Đăng ký người dùng mới
   - `/api/auth/login` - Đăng nhập

2. **Transactions** 
   - `/api/transactions` - CRUD cho giao dịch thu chi
   - `/api/transactions/summary` - Tổng hợp thống kê

3. **Products**
   - `/api/products` - CRUD cho sản phẩm/dịch vụ

4. **Reports**
   - `/api/reports` - Tạo báo cáo theo thời gian/loại

5. **Payments**
   - `/api/payments/momo` - Tích hợp cổng thanh toán MoMo
   - `/api/payments/callback` - Xử lý kết quả thanh toán

## Quy trình làm việc

1. **Quản lý thu nhập**
   - Tạo giao dịch thu nhập mới với thông tin chi tiết
   - Phân loại và gắn thẻ cho dễ dàng tra cứu
   - Xem lịch sử và báo cáo thu nhập

2. **Quản lý chi tiêu**
   - Tạo giao dịch chi tiêu mới với thông tin chi tiết
   - Phân loại và gắn thẻ cho dễ dàng tra cứu
   - Xem lịch sử và báo cáo chi tiêu

3. **Báo cáo tài chính**
   - Xem tổng quan về tình hình tài chính
   - Phân tích xu hướng thu chi theo thời gian
   - Xuất báo cáo chi tiết

4. **Quản lý đơn hàng**
   - Tạo đơn hàng mới với sản phẩm/dịch vụ
   - Theo dõi trạng thái thanh toán
   - Liên kết với giao dịch thu

## Kiến trúc mã nguồn

Dự án sử dụng kiến trúc module hóa với Next.js App Router:

1. **Page Components**: Chứa trong `/src/app/*/page.tsx`
   - Hiển thị UI và tương tác người dùng
   - Sử dụng React Server Components khi có thể

2. **Layout Components**: Trong `/src/app/*/layout.tsx`
   - Định nghĩa layout chung cho các trang
   - Quản lý navigation và UI elements

3. **Shared Components**: Trong `/src/components`
   - UI components tái sử dụng
   - Business logic components

4. **API Routes**: Trong `/src/app/api`
   - RESTful API endpoints
   - Xử lý requests và responses

5. **Core Logic**: Trong `/src/core`
   - Business logic
   - Service layers

6. **Utilities**: Trong `/src/lib`
   - Helper functions
   - Custom hooks

## Responsive Design

Ứng dụng được thiết kế đáp ứng trên nhiều thiết bị:

- **Desktop**: Layout đầy đủ với sidebar và nội dung chính
- **Tablet**: Responsive với sidebar có thể thu gọn
- **Mobile**: Giao diện tối ưu cho màn hình nhỏ, menu dạng accordion

## Troubleshooting

1. **Lỗi kết nối database**
   - Kiểm tra thông tin kết nối trong `.env.local`
   - Đảm bảo database service đang chạy

2. **Lỗi xác thực**
   - Xóa cookies và thử đăng nhập lại
   - Kiểm tra cấu hình NextAuth

3. **Lỗi giao diện**
   - Xóa cache trình duyệt
   - Kiểm tra console để phát hiện lỗi JavaScript

## Tài liệu tham khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/) 