# Quản Lý Thu Chi - Hướng Dẫn Sử Dụng và Tài Liệu Kỹ Thuật Chi Tiết

## Giới thiệu

Quản Lý Thu Chi là một ứng dụng web hiện đại được phát triển bằng Next.js 15, giúp người dùng quản lý thu nhập, chi tiêu, và theo dõi tài chính cá nhân hoặc doanh nghiệp. Hệ thống cung cấp giao diện trực quan với các tính năng phong phú như quản lý thu chi, báo cáo, quản lý sản phẩm, đơn hàng và tích hợp thanh toán.

### Đối tượng người dùng
- Chủ doanh nghiệp nhỏ và vừa
- Cá nhân cần quản lý tài chính
- Quản lý tài chính doanh nghiệp
- Nhân viên kế toán

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
│   │   ├── ui/          # UI components 
│   │   └── orders/      # Components quản lý đơn hàng
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
  - Sử dụng App Router (`app/`) thay vì Pages Router (`pages/`)
  - Hỗ trợ React Server Components (RSC) để tăng tốc hiệu suất
  - Server Actions để xử lý form và API trực tiếp
  - Streaming & Suspense để tải trang mượt mà
- **React 19**: Thư viện UI
- **TailwindCSS 4**: CSS utility framework
- **Radix UI**: Unstyled accessible components
  - Sử dụng Dialog, Select, Label, Alert, Toast
- **Lucide React**: Modern icon library
- **React Hook Form**: Form handling và validation
- **Zod**: Schema validation
- **Chart.js/Recharts**: Visualization libraries
  - Biểu đồ cột, đường, tròn cho thống kê thu chi
- **React Query**: Data fetching and caching
- **Date-fns**: Thư viện xử lý ngày tháng

### Backend
- **Next.js API Routes**: RESTful API endpoints
- **Prisma ORM**: Database ORM
- **Google Sheets API**: Sử dụng Google Sheets làm CSDL
  - Google API Client Library
  - Service Account cho authentication
- **NextAuth.js**: Authentication và authorization
- **Zod**: Schema validation
- **JWT**: Token-based authentication
- **Nodemailer**: Gửi email thông báo

### Database
- **Prisma Client**: TypeScript ORM
- **Google Sheets**: Cơ sở dữ liệu chính
- **Local Storage**: Lưu trữ cấu hình và cache

### Deployment
- **Vercel**: Nền tảng triển khai ứng dụng
- **Github Actions**: CI/CD pipeline

### Công cụ phát triển
- **TypeScript**: Type safety và developer experience
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **VS Code**: IDE chính
- **Git & GitHub**: Version control

## Cơ chế hoạt động

### 1. Xác thực người dùng
- Hệ thống sử dụng NextAuth.js để xác thực người dùng
- Đăng nhập/đăng ký thông qua JWT với mã hóa bcrypt cho mật khẩu
- Quản lý phiên và quyền truy cập
- Hỗ trợ đăng nhập bằng Google (OAuth)
- Phân quyền theo vai trò: Admin, User, Guest

### 2. Quản lý dữ liệu thu chi
- Mô hình dữ liệu với Prisma schema
- Nhập liệu thu/chi với phân loại và mô tả chi tiết
- Hỗ trợ tệp đính kèm và metadata cho mỗi giao dịch
- Các danh mục thu chi được tùy chỉnh
- Hỗ trợ lưu trữ hình ảnh hóa đơn

#### Cấu trúc dữ liệu Thu Chi:
```typescript
type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  description?: string;
  attachments?: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Báo cáo và thống kê
- Tổng hợp dữ liệu thu chi theo nhiều tiêu chí
- Biểu đồ trực quan với Chart.js và Recharts
  - Biểu đồ cột: So sánh thu/chi theo từng tháng
  - Biểu đồ tròn: Phân bổ chi tiêu theo danh mục
  - Biểu đồ đường: Xu hướng thu chi theo thời gian
- Xuất báo cáo dạng PDF (jsPDF) hoặc Excel (xlsx)
- Lọc báo cáo theo ngày, tháng, năm, danh mục
- Thống kê số dư hiện tại và dự báo tương lai

### 4. Tích hợp thanh toán
- Hỗ trợ thanh toán qua MoMo và các cổng khác
- Xử lý callback và cập nhật trạng thái giao dịch
- Lưu trữ lịch sử thanh toán
- Hỗ trợ tạo mã QR thanh toán
- API tích hợp với cổng thanh toán MoMo

#### Quy trình thanh toán:
1. Khởi tạo giao dịch
2. Tạo yêu cầu thanh toán đến cổng MoMo
3. Chuyển hướng người dùng đến trang thanh toán
4. Xử lý callback từ MoMo
5. Cập nhật trạng thái đơn hàng

### 5. Quản lý sản phẩm/dịch vụ
- Thêm, sửa, xóa thông tin sản phẩm
- Quản lý tồn kho
- Liên kết với giao dịch thu chi
- Quản lý danh mục sản phẩm
- Theo dõi lịch sử giá

#### Cấu trúc dữ liệu Sản phẩm:
```typescript
type Product = {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  price: number;
  description?: string;
  imageUrl?: string;
  ingredients?: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Quản lý đơn hàng
- Tạo đơn hàng mới với danh sách sản phẩm
- Theo dõi trạng thái đơn hàng
- Cập nhật trạng thái giao hàng
- Quản lý thông tin khách hàng
- Gửi email thông báo khi có đơn hàng mới
- Xuất hóa đơn PDF

#### Cấu trúc dữ liệu Đơn hàng:
```typescript
type Order = {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  address?: string;
  orderDate: Date;
  deliveryDate?: Date;
  totalAmount: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentMethod: 'cash' | 'momo' | 'bank_transfer';
  note?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 7. Đồng bộ với Google Sheets
- Kết nối với Google Sheets API
- Đồng bộ dữ liệu hai chiều
- Tự động cập nhật khi có thay đổi
- Backup dữ liệu tự động

## Chi tiết kỹ thuật

### Google Sheets API Integration
```typescript
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const jwt = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: SCOPES,
});

export async function getSpreadsheet() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);
  await doc.loadInfo();
  return doc;
}
```

### NextAuth Configuration
```typescript
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Authenticate user with credentials
        // ...
      }
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role to token
      // ...
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      // ...
      return session;
    },
  },
});
```

### MoMo Payment Integration
```typescript
import axios from 'axios';
import crypto from 'crypto';

export async function createMomoPayment(orderId, amount, orderInfo) {
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/payment-result`;
  const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/momo-callback`;
  
  const requestId = `${Date.now()}_${orderId}`;
  const requestType = "captureWallet";
  const extraData = "";
  
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
  
  const signature = crypto.createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
  
  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl: notifyUrl,
    extraData,
    requestType,
    signature,
    lang: "vi"
  };
  
  const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody);
  return response.data;
}
```

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
- Cập nhật các thông tin cấu hình cần thiết:
```
# Database
DATABASE_URL="..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google API
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_PRIVATE_KEY="..."
GOOGLE_SHEET_ID="..."

# MoMo Payment
MOMO_PARTNER_CODE="..."
MOMO_ACCESS_KEY="..."
MOMO_SECRET_KEY="..."
```

4. Khởi tạo cấu trúc Google Sheets
- Tạo Google Sheet với các tab:
  - Transactions: Lưu giao dịch thu chi
  - Products: Lưu thông tin sản phẩm
  - Orders: Lưu thông tin đơn hàng
  - Categories: Lưu thông tin danh mục

5. Chạy ứng dụng
```bash
npm run dev
```

6. Truy cập ứng dụng tại `http://localhost:3000`

## Lưu ý quan trọng về giao diện

1. **Nút (Button)**: 
   - Các nút trong ứng dụng KHÔNG được sử dụng nền đen
   - Sử dụng TailwindCSS để styling
   - Luôn sử dụng màu sắc phù hợp với ngữ cảnh (primary, secondary, accent)
   - Sử dụng component Button từ /src/components/ui/button.tsx

2. **Text**: 
   - Sử dụng text-gray-700 cho các văn bản chính
   - Đảm bảo độ tương phản và khả năng đọc
   - Sử dụng font sans-serif cho toàn bộ ứng dụng

## API và Endpoints

Dự án cung cấp các API endpoints cho các tính năng chính:

1. **Authentication**
   - `POST /api/auth/register` - Đăng ký người dùng mới
     - Body: `{ name, email, password }`
   - `POST /api/auth/login` - Đăng nhập
     - Body: `{ email, password }`
   - `GET /api/auth/session` - Lấy thông tin phiên

2. **Transactions** 
   - `GET /api/transactions` - Lấy danh sách giao dịch
     - Query params: `{ type, category, startDate, endDate, page, limit }`
   - `POST /api/transactions` - Thêm giao dịch mới
     - Body: `{ amount, type, category, date, description, attachments }`
   - `PUT /api/transactions/:id` - Cập nhật giao dịch
     - Body: `{ amount, type, category, date, description, attachments }`
   - `DELETE /api/transactions/:id` - Xóa giao dịch
   - `GET /api/transactions/summary` - Lấy tổng hợp thu chi
     - Query params: `{ startDate, endDate, groupBy }`

3. **Products**
   - `GET /api/products` - Lấy danh sách sản phẩm
     - Query params: `{ category, status, search, page, limit }`
   - `POST /api/products` - Thêm sản phẩm mới
     - Body: `{ name, code, categoryId, price, description, imageUrl, ingredients, status }`
   - `PUT /api/products/:id` - Cập nhật sản phẩm
     - Body: `{ name, code, categoryId, price, description, imageUrl, ingredients, status }`
   - `DELETE /api/products/:id` - Xóa sản phẩm

4. **Orders**
   - `GET /api/orders` - Lấy danh sách đơn hàng
     - Query params: `{ status, startDate, endDate, search, page, limit }`
   - `POST /api/orders` - Tạo đơn hàng mới
     - Body: `{ customerName, phone, address, products: [{ id, quantity, price }], paymentMethod }`
   - `PUT /api/orders/:id` - Cập nhật đơn hàng
     - Body: `{ status, paymentStatus, deliveryDate, note }`
   - `DELETE /api/orders/:id` - Hủy đơn hàng

5. **Reports**
   - `GET /api/reports/income-expense` - Báo cáo thu chi
     - Query params: `{ startDate, endDate, groupBy }`
   - `GET /api/reports/sales` - Báo cáo doanh số
     - Query params: `{ startDate, endDate, groupBy }`
   - `GET /api/reports/export` - Xuất báo cáo
     - Query params: `{ type, format, startDate, endDate }`

6. **Payments**
   - `POST /api/payments/momo` - Tạo giao dịch MoMo
     - Body: `{ orderId, amount, orderInfo }`
   - `POST /api/payments/callback` - Xử lý kết quả thanh toán
     - Body: `{ orderId, resultCode, message, transId, amount }`

7. **Categories**
   - `GET /api/categories` - Lấy danh sách danh mục
     - Query params: `{ type }`
   - `POST /api/categories` - Thêm danh mục mới
     - Body: `{ name, code, parentId, description, type }`
   - `PUT /api/categories/:id` - Cập nhật danh mục
     - Body: `{ name, code, parentId, description, type }`
   - `DELETE /api/categories/:id` - Xóa danh mục

## Quy trình làm việc

### 1. Quản lý thu nhập
1. Truy cập trang quản lý thu nhập
2. Nhấn nút "Thêm giao dịch thu nhập"
3. Nhập thông tin chi tiết:
   - Số tiền
   - Danh mục (Lương, bán hàng, đầu tư, v.v.)
   - Ngày giao dịch
   - Mô tả chi tiết (tùy chọn)
   - Đính kèm hình ảnh (tùy chọn)
4. Lưu giao dịch
5. Xem lịch sử thu nhập và báo cáo

### 2. Quản lý chi tiêu
1. Truy cập trang quản lý chi tiêu
2. Nhấn nút "Thêm giao dịch chi tiêu"
3. Nhập thông tin chi tiết:
   - Số tiền
   - Danh mục (Ăn uống, đi lại, mua sắm, v.v.)
   - Ngày giao dịch
   - Mô tả chi tiết (tùy chọn)
   - Đính kèm hình ảnh hóa đơn (tùy chọn)
4. Lưu giao dịch
5. Xem lịch sử chi tiêu và báo cáo

### 3. Báo cáo tài chính
1. Truy cập trang báo cáo
2. Chọn loại báo cáo:
   - Tổng quan thu chi
   - Chi tiết theo danh mục
   - Xu hướng theo thời gian
3. Thiết lập khoảng thời gian (ngày/tháng/năm)
4. Xem biểu đồ và thông tin tổng hợp
5. Xuất báo cáo (PDF/Excel) nếu cần

### 4. Quản lý sản phẩm
1. Truy cập trang quản lý sản phẩm
2. Thêm/sửa/xóa thông tin sản phẩm
3. Quản lý danh mục sản phẩm
4. Cập nhật giá và thông tin khác

### 5. Quản lý đơn hàng
1. Truy cập trang quản lý đơn hàng
2. Tạo đơn hàng mới với thông tin:
   - Thông tin khách hàng
   - Danh sách sản phẩm
   - Số lượng và giá
   - Phương thức thanh toán
3. Theo dõi trạng thái đơn hàng
4. Cập nhật trạng thái giao hàng
5. Xem báo cáo doanh số

## Kiến trúc mã nguồn

Dự án sử dụng kiến trúc module hóa với Next.js App Router:

1. **Page Components**: Chứa trong `/src/app/*/page.tsx`
   - Hiển thị UI và tương tác người dùng
   - Sử dụng React Server Components cho tối ưu hiệu suất
   - Ví dụ: Dashboard Page, Orders Page, Reports Page

2. **Layout Components**: Trong `/src/app/*/layout.tsx`
   - Định nghĩa layout chung cho các trang
   - Quản lý navigation và UI elements
   - Ví dụ: Main Layout, Dashboard Layout

3. **Shared Components**: Trong `/src/components`
   - UI components tái sử dụng (Button, Card, Table)
   - Business logic components (TransactionForm, OrderList)
   - Ví dụ: RecentTransactions, MomoPaymentButton

4. **API Routes**: Trong `/src/app/api`
   - RESTful API endpoints
   - Xử lý requests và responses
   - Ví dụ: Transaction API, Order API

5. **Core Logic**: Trong `/src/core`
   - Business logic
   - Service layers
   - Ví dụ: AuthService, TransactionService

6. **Utilities**: Trong `/src/lib`
   - Helper functions
   - Custom hooks
   - Ví dụ: formatCurrency, useTransactions

## Mô hình dữ liệu

### Cấu trúc Database (Google Sheets):

1. **Sheet: Transactions**
   - id: ID giao dịch
   - amount: Số tiền
   - type: Loại (thu/chi)
   - category: Danh mục
   - date: Ngày giao dịch
   - description: Mô tả
   - attachments: URL đính kèm
   - userId: ID người dùng
   - createdAt: Thời gian tạo
   - updatedAt: Thời gian cập nhật

2. **Sheet: Products**
   - id: ID sản phẩm
   - name: Tên sản phẩm
   - code: Mã sản phẩm
   - categoryId: ID danh mục
   - price: Giá bán
   - description: Mô tả
   - imageUrl: URL hình ảnh
   - ingredients: Danh sách nguyên liệu
   - status: Trạng thái
   - createdAt: Thời gian tạo
   - updatedAt: Thời gian cập nhật

3. **Sheet: Orders**
   - id: ID đơn hàng
   - orderCode: Mã đơn hàng
   - customerName: Tên khách hàng
   - phone: Số điện thoại
   - address: Địa chỉ
   - orderDate: Ngày đặt hàng
   - deliveryDate: Ngày giao hàng
   - totalAmount: Tổng tiền
   - status: Trạng thái
   - paymentStatus: Trạng thái thanh toán
   - paymentMethod: Phương thức thanh toán
   - note: Ghi chú
   - createdBy: ID người tạo
   - createdAt: Thời gian tạo
   - updatedAt: Thời gian cập nhật

4. **Sheet: Categories**
   - id: ID danh mục
   - name: Tên danh mục
   - code: Mã danh mục
   - parentId: ID danh mục cha
   - description: Mô tả
   - type: Loại danh mục
   - status: Trạng thái
   - createdAt: Thời gian tạo
   - updatedAt: Thời gian cập nhật

5. **Sheet: OrderItems**
   - id: ID chi tiết đơn hàng
   - orderId: ID đơn hàng
   - productId: ID sản phẩm
   - quantity: Số lượng
   - price: Đơn giá
   - amount: Thành tiền
   - createdAt: Thời gian tạo

6. **Sheet: Payments**
   - id: ID thanh toán
   - orderId: ID đơn hàng
   - amount: Số tiền
   - method: Phương thức
   - status: Trạng thái
   - transactionId: ID giao dịch (MoMo/Bank)
   - paymentDate: Ngày thanh toán
   - note: Ghi chú
   - createdAt: Thời gian tạo

## Responsive Design

Ứng dụng được thiết kế đáp ứng trên nhiều thiết bị:

- **Desktop**: Layout đầy đủ với sidebar và nội dung chính
  - Breakpoint: >= 1024px
  - Sidebar cố định bên trái
  - Dashboard dạng grid 3-4 cột
  - Bảng dữ liệu đầy đủ cột

- **Tablet**: Responsive với sidebar có thể thu gọn
  - Breakpoint: 768px - 1023px
  - Sidebar có thể đóng/mở
  - Dashboard dạng grid 2 cột
  - Bảng dữ liệu ẩn bớt cột không quan trọng

- **Mobile**: Giao diện tối ưu cho màn hình nhỏ
  - Breakpoint: < 768px
  - Sidebar ẩn và hiển thị khi cần
  - Dashboard dạng single column
  - Bảng dữ liệu chuyển sang dạng card
  - Menu dạng hamburger

## Bảo mật

### Xác thực và phân quyền
- JSON Web Tokens (JWT) cho authentication
- Role-based access control (RBAC)
- Rate limiting cho API endpoints
- CSRF protection

### Bảo mật dữ liệu
- Mã hóa mật khẩu với bcrypt
- Validation input với Zod
- Sanitization dữ liệu nhập vào
- HTTPS cho mọi kết nối

## Hiệu suất và Tối ưu

### Tối ưu Frontend
- React Server Components cho page load nhanh
- Code splitting để giảm bundle size
- Image optimization với Next.js Image
- Client-side caching với React Query

### Tối ưu Backend
- Serverless functions tối ưu cho scaling
- Incremental Static Regeneration cho những trang ít thay đổi
- HTTP caching với Cache-Control headers
- Connection pooling cho database queries

## Kế hoạch phát triển tương lai

### Giai đoạn 1 (Hiện tại)
- Quản lý thu chi cơ bản
- Quản lý đơn hàng và sản phẩm
- Tích hợp thanh toán MoMo
- Báo cáo thống kê đơn giản

### Giai đoạn 2 (Sắp tới)
- Tích hợp thanh toán đa nền tảng (Zalopay, VNPay)
- Tối ưu hiệu suất và khả năng mở rộng
- Hệ thống thông báo real-time
- Mobile app với React Native

### Giai đoạn 3 (Tương lai)
- Tích hợp AI để phân tích chi tiêu và đề xuất
- Phân tích dữ liệu nâng cao
- Chatbot hỗ trợ khách hàng tự động
- Tích hợp với hệ thống kế toán

## Troubleshooting

1. **Lỗi kết nối database**
   - Kiểm tra thông tin kết nối trong `.env.local`
   - Đảm bảo service account có quyền truy cập Google Sheets
   - Kiểm tra giới hạn API quota của Google

2. **Lỗi xác thực**
   - Xóa cookies và thử đăng nhập lại
   - Kiểm tra cấu hình NextAuth
   - Kiểm tra thời hạn JWT token
   - Đảm bảo NEXTAUTH_URL đúng với môi trường

3. **Lỗi thanh toán MoMo**
   - Kiểm tra thông tin cấu hình MoMo trong `.env.local`
   - Đảm bảo URL callback đã được whitelist bên MoMo
   - Kiểm tra log giao dịch trong dashboard MoMo

4. **Lỗi giao diện**
   - Xóa cache trình duyệt
   - Kiểm tra console để phát hiện lỗi JavaScript
   - Đảm bảo các breakpoint responsive đúng
   - Kiểm tra compatibility với các trình duyệt khác nhau

5. **Lỗi kết nối Google Sheets**
   - Kiểm tra quyền truy cập của Service Account
   - Đảm bảo Google Sheets API đã được bật
   - Kiểm tra định dạng của GOOGLE_PRIVATE_KEY

## Tài liệu tham khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Sheets API](https://developers.google.com/sheets/api/guides/concepts)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [MoMo Payment API](https://developers.momo.vn/)
- [React Query Documentation](https://tanstack.com/query/latest)

# Phụ lục: Báo Cáo Dự Án Chi Tiết

## 1. Tổng Quan Dự Án

### Thông Tin Dự Án
- **Tên dự án**: Quản Lý Thu Chi
- **Loại dự án**: Ứng dụng web quản lý tài chính
- **Ngày bắt đầu**: 01/01/2023
- **Ngày hoàn thành**: 31/12/2023
- **Trạng thái hiện tại**: Đang phát triển giai đoạn 1
- **Nhà phát triển**: [Tên công ty/Cá nhân]
- **Địa chỉ**: [Địa chỉ công ty/Cá nhân]
- **Liên hệ**: [Email/Số điện thoại]

### Tóm Tắt Dự Án
Quản Lý Thu Chi là một ứng dụng web hiện đại được phát triển nhằm giúp doanh nghiệp vừa và nhỏ quản lý tài chính, theo dõi thu chi, quản lý đơn hàng và sản phẩm một cách hiệu quả. Dự án sử dụng công nghệ tiên tiến như Next.js 15, React 19, và tích hợp với Google Sheets để tạo ra một giải pháp đơn giản, dễ sử dụng nhưng mạnh mẽ cho việc quản lý tài chính.

### Mục Tiêu Dự Án
1. Xây dựng ứng dụng quản lý tài chính toàn diện cho doanh nghiệp vừa và nhỏ
2. Tạo giao diện người dùng trực quan, dễ sử dụng trên mọi thiết bị
3. Cung cấp báo cáo tài chính chi tiết, hỗ trợ ra quyết định
4. Tối ưu hóa quy trình quản lý đơn hàng và sản phẩm
5. Tích hợp thanh toán trực tuyến với nhiều cổng thanh toán phổ biến

### Phạm Vi Dự Án
- **Bao gồm**: Quản lý thu chi, quản lý đơn hàng, quản lý sản phẩm, báo cáo thống kê, tích hợp thanh toán MoMo
- **Không bao gồm**: Hệ thống quản lý nhân sự, quản lý tồn kho nâng cao, tích hợp POS

## 2. Phân Tích Yêu Cầu Chi Tiết

### Yêu Cầu Chức Năng

#### Quản Lý Người Dùng
1. **UC-01**: Đăng ký tài khoản mới
   - **Mô tả**: Người dùng có thể đăng ký tài khoản mới bằng email và mật khẩu hoặc đăng nhập với Google
   - **Tác nhân**: Khách
   - **Tiền điều kiện**: Không có
   - **Hậu điều kiện**: Tài khoản được tạo và người dùng được đăng nhập
   - **Luồng chính**:
     1. Người dùng truy cập trang đăng ký
     2. Nhập thông tin: tên, email, mật khẩu
     3. Hệ thống xác thực thông tin
     4. Tạo tài khoản và đăng nhập người dùng

2. **UC-02**: Đăng nhập hệ thống
   - **Mô tả**: Người dùng đăng nhập bằng email/mật khẩu hoặc Google
   - **Tác nhân**: Người dùng đã đăng ký
   - **Luồng chính**:
     1. Người dùng truy cập trang đăng nhập
     2. Nhập email và mật khẩu hoặc chọn "Đăng nhập với Google"
     3. Hệ thống xác thực và đăng nhập người dùng

#### Quản Lý Thu Chi
3. **UC-03**: Thêm giao dịch thu/chi
   - **Mô tả**: Người dùng thêm giao dịch thu nhập hoặc chi tiêu mới
   - **Tác nhân**: Người dùng đã đăng nhập
   - **Luồng chính**:
     1. Truy cập trang "Thêm giao dịch"
     2. Chọn loại: Thu/Chi
     3. Nhập số tiền, danh mục, ngày, mô tả
     4. Đính kèm hình ảnh (tùy chọn)
     5. Lưu giao dịch

4. **UC-04**: Quản lý danh mục thu chi
   - **Mô tả**: Người dùng có thể tạo, sửa, xóa danh mục thu chi
   - **Tác nhân**: Người dùng đã đăng nhập
   - **Luồng chính**:
     1. Truy cập trang "Danh mục"
     2. Thêm/sửa/xóa danh mục
     3. Thiết lập loại danh mục (thu/chi)

#### Báo Cáo Thống Kê
5. **UC-05**: Xem báo cáo thu chi
   - **Mô tả**: Người dùng xem báo cáo thu chi theo thời gian
   - **Tác nhân**: Người dùng đã đăng nhập
   - **Luồng chính**:
     1. Truy cập trang "Báo cáo"
     2. Chọn loại báo cáo và khoảng thời gian
     3. Xem biểu đồ và dữ liệu tổng hợp

### Yêu Cầu Phi Chức Năng

1. **NFR-01**: Hiệu suất
   - Thời gian phản hồi trang < 2 giây
   - Thời gian tải trang dashboard < 3 giây
   - Xử lý đồng thời tối thiểu 100 người dùng

2. **NFR-02**: Bảo mật
   - Mật khẩu được mã hóa với bcrypt
   - Sử dụng HTTPS cho tất cả kết nối
   - JWT cho xác thực với thời hạn 24 giờ
   - CSRF protection cho tất cả form

3. **NFR-03**: Khả năng sử dụng
   - Giao diện responsive trên desktop, tablet, mobile
   - Tuân thủ WCAG 2.1 AA cho accessibility
   - Hỗ trợ trình duyệt: Chrome, Firefox, Safari, Edge

4. **NFR-04**: Độ tin cậy
   - Uptime > 99.5%
   - Backup dữ liệu hàng ngày
   - Thời gian phục hồi < 4 giờ

5. **NFR-05**: Khả năng mở rộng
   - Kiến trúc module hóa cho dễ mở rộng
   - Hỗ trợ đa ngôn ngữ (i18n)
   - API documentation cho tích hợp bên thứ ba

## 3. Thiết Kế Hệ Thống Chi Tiết

### Kiến Trúc Hệ Thống

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│  Client         │         │  Next.js Server │
│  Browser/Mobile │◄────────►  (Vercel)       │
│                 │         │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │  Google Sheets  │
                            │  (Database)     │
                            │                 │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │  External APIs  │
                            │  (MoMo, Email)  │
                            │                 │
                            └─────────────────┘
```

### Thiết Kế Database Chi Tiết

#### Sheet: Transactions
| Trường       | Kiểu dữ liệu | Mô tả                     | Ràng buộc               |
|--------------|--------------|---------------------------|-------------------------|
| id           | String       | ID giao dịch              | Primary Key, UUID v4    |
| amount       | Number       | Số tiền                   | > 0                     |
| type         | String       | Loại giao dịch            | "income" hoặc "expense" |
| category     | String       | Danh mục                  | Foreign Key Categories  |
| date         | Date         | Ngày giao dịch            | ISO Date                |
| description  | String       | Mô tả                     | Tối đa 500 ký tự        |
| attachments  | String       | URL đính kèm              | Comma-separated URLs    |
| userId       | String       | ID người dùng             | Foreign Key Users       |
| createdAt    | Date         | Thời gian tạo             | ISO Date                |
| updatedAt    | Date         | Thời gian cập nhật        | ISO Date                |

#### Sheet: Products
| Trường       | Kiểu dữ liệu | Mô tả                     | Ràng buộc               |
|--------------|--------------|---------------------------|-------------------------|
| id           | String       | ID sản phẩm               | Primary Key, UUID v4    |
| name         | String       | Tên sản phẩm              | Không trống             |
| code         | String       | Mã sản phẩm               | Unique, không trống     |
| categoryId   | String       | ID danh mục               | Foreign Key Categories  |
| price        | Number       | Giá bán                   | > 0                     |
| description  | String       | Mô tả                     | Tối đa 1000 ký tự       |
| imageUrl     | String       | URL hình ảnh              | URL hợp lệ              |
| ingredients  | String       | Danh sách nguyên liệu     | JSON string             |
| status       | String       | Trạng thái                | "active" hoặc "inactive"|
| createdAt    | Date         | Thời gian tạo             | ISO Date                |
| updatedAt    | Date         | Thời gian cập nhật        | ISO Date                |

### Thiết Kế Giao Diện

#### Wireframes Chính
1. **Trang Dashboard**
   - Header với logo, menu, thông tin người dùng
   - Sidebar với navigation chính
   - Tổng quan thu chi với biểu đồ
   - Widgets: Số dư hiện tại, giao dịch gần đây
   - Quick actions: Thêm giao dịch, tạo đơn hàng

2. **Trang Quản Lý Thu Chi**
   - Bộ lọc: thời gian, loại, danh mục
   - Bảng dữ liệu với phân trang
   - Form thêm/sửa giao dịch
   - Biểu đồ thống kê

3. **Trang Quản Lý Đơn Hàng**
   - Danh sách đơn hàng với trạng thái
   - Form tạo đơn hàng mới
   - Chi tiết đơn hàng
   - Lịch sử thanh toán

### Prototype
Prototype high-fidelity đã được thiết kế bằng Figma và có thể truy cập tại [link_prototype].

## 4. Kế Hoạch Phát Triển

### Phương Pháp Phát Triển
Dự án áp dụng phương pháp phát triển Agile Scrum với:
- Sprint dài 2 tuần
- Daily stand-up meetings
- Sprint planning và review
- Retrospective sau mỗi sprint

### Quy Trình Làm Việc
1. **Requirement Analysis**: Thu thập và phân tích yêu cầu
2. **Design**: Thiết kế UI/UX và kiến trúc hệ thống
3. **Development**: Phát triển chức năng theo sprint
4. **Testing**: Kiểm thử đơn vị và tích hợp
5. **Deployment**: Triển khai lên môi trường staging và production
6. **Maintenance**: Bảo trì và cập nhật định kỳ

### Lịch Trình Phát Triển Chi Tiết

#### Giai Đoạn 1: Thiết Lập Dự Án (2 tuần)
- Thiết lập repository và môi trường phát triển
- Xây dựng kiến trúc cơ bản
- Thiết kế database và API endpoints
- Tạo UI components chính

#### Giai Đoạn 2: Core Features (6 tuần)
- Sprint 1: Authentication và user management
- Sprint 2: Quản lý thu chi cơ bản
- Sprint 3: Quản lý sản phẩm và danh mục

#### Giai Đoạn 3: Extended Features (6 tuần)
- Sprint 4: Quản lý đơn hàng
- Sprint 5: Báo cáo và thống kê
- Sprint 6: Tích hợp thanh toán MoMo

#### Giai Đoạn 4: Optimization & Launch (4 tuần)
- Sprint 7: Testing và bug fixes
- Sprint 8: Performance optimization và final release

### Kế Hoạch CI/CD
- **Continuous Integration**: GitHub Actions
  - Kiểm tra code quality mỗi khi push
  - Chạy unit tests tự động
  - Báo cáo coverage

- **Continuous Deployment**:
  - Tự động deploy đến staging khi merge vào branch develop
  - Deploy thủ công đến production khi merge vào branch main

## 5. Chiến Lược Kiểm Thử

### Kiểm Thử Đơn Vị
- Sử dụng Jest cho unit testing
- Coverage yêu cầu > 80% cho core functions
- Kiểm thử tự động chạy qua GitHub Actions

### Kiểm Thử Tích Hợp
- Sử dụng Cypress cho end-to-end testing
- Kiểm thử các luồng nghiệp vụ chính
- Kiểm thử tích hợp với các API bên ngoài

### Kiểm Thử UI/UX
- Kiểm thử tương thích trình duyệt (Chrome, Firefox, Safari, Edge)
- Kiểm thử responsive trên các thiết bị khác nhau
- Kiểm thử accessibility với axe-core

### Kiểm Thử Hiệu Suất
- Đánh giá Core Web Vitals (LCP, FID, CLS)
- Lighthouse audits cho hiệu suất, SEO, accessibility
- Load testing với k6 hoặc Artillery

## 6. Đánh Giá Rủi Ro và Chiến Lược Giảm Thiểu

| ID | Rủi ro | Mức độ (1-5) | Tác động (1-5) | Chiến lược giảm thiểu |
|----|--------|-------------|---------------|------------------------|
| R1 | Giới hạn API Google Sheets | 4 | 5 | Implement caching, batch requests, fallback solution |
| R2 | Vấn đề bảo mật dữ liệu | 3 | 5 | Regular security audits, input validation, HTTPS |
| R3 | Hiệu suất ứng dụng kém | 3 | 4 | Optimize rendering, code splitting, caching |
| R4 | Thay đổi yêu cầu | 4 | 3 | Agile methodology, clear documentation, regular reviews |
| R5 | Tương thích trình duyệt | 2 | 3 | Cross-browser testing, progressive enhancement |

## 7. Phân Tích Chi Phí - Lợi Ích

### Chi Phí
1. **Chi phí phát triển**:
   - Nhân sự phát triển: xxx VND
   - Thiết kế UI/UX: xxx VND
   - Testing & QA: xxx VND

2. **Chi phí vận hành**:
   - Vercel hosting: $20/tháng
   - Domain & SSL: $15/năm
   - Google Workspace: $6/người dùng/tháng
   - Maintenance: xxx VND/năm

### Lợi Ích
1. **Lợi ích định lượng**:
   - Tiết kiệm 20 giờ/tháng trong quản lý tài chính
   - Giảm 15% lỗi trong theo dõi thu chi
   - Tăng 25% hiệu quả quản lý đơn hàng

2. **Lợi ích định tính**:
   - Cải thiện trải nghiệm khách hàng
   - Nâng cao tính minh bạch trong quản lý tài chính
   - Hỗ trợ ra quyết định dựa trên dữ liệu
   - Tăng tính chuyên nghiệp của doanh nghiệp

### ROI (Return on Investment)
- Thời gian hoàn vốn dự kiến: 12 tháng
- ROI 5 năm: xxx%

## 8. Kế Hoạch Triển Khai và Vận Hành

### Kế Hoạch Triển Khai
1. **Chuẩn Bị**:
   - Thiết lập môi trường production trên Vercel
   - Cấu hình domain và SSL
   - Thiết lập monitoring và logging

2. **Triển Khai**:
   - Triển khai theo phương pháp blue-green deployment
   - Kiểm tra smoke test sau mỗi deployment
   - Rollback plan nếu phát hiện lỗi nghiêm trọng

3. **Go-Live**:
   - Thông báo cho người dùng trước 1 tuần
   - Chuẩn bị tài liệu hướng dẫn sử dụng
   - Hỗ trợ kỹ thuật 24/7 trong 3 ngày đầu

### Kế Hoạch Bảo Trì
1. **Bảo Trì Định Kỳ**:
   - Cập nhật dependencies: hàng tháng
   - Kiểm tra bảo mật: hàng quý
   - Optimize database: hàng tháng

2. **Monitoring**:
   - Sử dụng Vercel Analytics và Google Analytics
   - Error tracking với Sentry
   - Uptime monitoring với Uptime Robot

3. **Backup**:
   - Backup tự động Google Sheets: hàng ngày
   - Backup code và configuration: liên tục với Git

## 9. Kết Luận và Khuyến Nghị

### Tóm Tắt Dự Án
Dự án Quản Lý Thu Chi là một giải pháp toàn diện cho việc quản lý tài chính và đơn hàng cho doanh nghiệp vừa và nhỏ. Với công nghệ hiện đại, giao diện người dùng thân thiện, và khả năng tích hợp cao, hệ thống cung cấp một nền tảng mạnh mẽ cho việc theo dõi và phân tích tài chính.

### Khuyến Nghị
1. **Triển khai theo giai đoạn** để giảm thiểu rủi ro và thu thập phản hồi sớm
2. **Đầu tư vào testing** để đảm bảo chất lượng và độ tin cậy cao
3. **Xây dựng tài liệu chi tiết** cho người dùng và nhà phát triển
4. **Lên kế hoạch nâng cấp** với các tính năng mới dựa trên phản hồi người dùng

### Các Bước Tiếp Theo
1. Phê duyệt kế hoạch dự án
2. Thiết lập team và kickoff meeting
3. Bắt đầu sprint đầu tiên theo kế hoạch
4. Thiết lập quy trình feedback và cải tiến liên tục

## 10. Phụ Lục

### Quy Tắc Coding
- Tuân thủ Airbnb JavaScript Style Guide
- Sử dụng ESLint và Prettier cho code formatting
- Viết unit tests cho mọi component và util function
- Sử dụng TypeScript strict mode

### Quy Trình Git
- Nhánh chính: main (production), develop (staging)
- Nhánh tính năng: feature/*, bugfix/*, hotfix/*
- Pull request yêu cầu ít nhất 1 reviewer
- Squash merge khi merge vào develop hoặc main

### Tài Liệu API
Chi tiết API được tạo tự động bằng Swagger và có sẵn tại [link_api_docs].

### Hình Ảnh Minh Họa

#### Logo và Thương Hiệu
![Logo Quản Lý Thu Chi](/public/next.svg)

#### Các Biểu Đồ Thống Kê Mẫu
**Biểu đồ thu chi theo tháng**
```
Thu nhập      ┌─────┐
              │     │
              │     │    ┌─────┐
              │     │    │     │             ┌─────┐
              │     │    │     │    ┌─────┐  │     │
              │     │    │     │    │     │  │     │
──────────────┴─────┴────┴─────┴────┴─────┴──┴─────┴─────
              T1    T2    T3    T4    T5    T6    T7
              
Chi tiêu      ┌─────┐
              │     │    ┌─────┐          
              │     │    │     │    ┌─────┐         
              │     │    │     │    │     │    ┌─────┐
              │     │    │     │    │     │    │     │
──────────────┴─────┴────┴─────┴────┴─────┴────┴─────┴─────
              T1    T2    T3    T4    T5    T6    T7
```

**Biểu đồ phân bổ chi tiêu theo danh mục**
```
          ┌───────────────────────────────┐
          │           Ăn uống            │
          │            35%               │
          │                              │
┌─────────┼──────────────────────────────┼─────────┐
│         │                              │         │
│  Đi lại │                              │  Mua sắm│
│   15%   │                              │   20%   │
│         │                              │         │
└─────────┼──────────────────────────────┼─────────┘
          │                              │
          │           Hóa đơn            │
          │            30%               │
          │                              │
          └──────────────────────────────┘
```

#### Giao Diện Người Dùng

**Dashboard**
```
┌────────────────────────────────────────────────────────┐
│ QUẢN LÝ THU CHI                           User Name ▼ │
├────────┬───────────────────────────────────────────────┤
│        │                                               │
│        │  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
│        │  │ Tổng thu    │  │ Tổng chi    │  │ Số dư  ││
│ MENU   │  │ 15.000.000đ │  │ 8.500.000đ  │  │ 6.5M đ ││
│        │  └─────────────┘  └─────────────┘  └────────┘│
│        │                                               │
│ Dashboard │  ┌─────────────────────────────────────────┐│
│        │  │                                         ││
│ Thu nhập │  │           BIỂU ĐỒ THU CHI             ││
│        │  │                                         ││
│ Chi tiêu │  │                                         ││
│        │  │                                         ││
│ Đơn hàng │  └─────────────────────────────────────────┘│
│        │                                               │
│ Sản phẩm │  ┌─────────────────────────────────────────┐│
│        │  │         GIAO DỊCH GẦN ĐÂY                ││
│ Báo cáo │  │                                         ││
│        │  │ - Lương tháng 5: +10.000.000đ           ││
│ Cài đặt │  │ - Mua sắm: -1.500.000đ                 ││
│        │  │ - Ăn uống: -500.000đ                    ││
│        │  │                                         ││
│        │  └─────────────────────────────────────────┘│
└────────┴───────────────────────────────────────────────┘
```

**Form thêm giao dịch**
```
┌─────────────────────────────────────────────┐
│            THÊM GIAO DỊCH MỚI               │
├─────────────────────────────────────────────┤
│ Loại giao dịch: ○ Thu nhập  ● Chi tiêu     │
│                                             │
│ Số tiền:        [        500,000        ]  │
│                                             │
│ Danh mục:       [ Ăn uống          (▼) ]   │
│                                             │
│ Ngày:           [ 15/06/2023        (📅) ] │
│                                             │
│ Mô tả:                                      │
│ [          Ăn trưa với khách hàng        ] │
│ [                                         ] │
│                                             │
│ Đính kèm:       [ Chọn tệp... ] [ Tải lên ]│
│                                             │
│ [    Hủy    ]              [    Lưu     ]  │
└─────────────────────────────────────────────┘
```

#### Hình Ảnh Tích Hợp Thanh Toán

**Cổng thanh toán MoMo**
![MoMo Icon](/public/momo-icon.svg)

**Cổng thanh toán VNPay**
![VNPay Logo](/public/vnpay-logo.png)

#### Responsive Design

**Desktop Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ Header                                          User Info   │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                   │
│         │    ┌───────────┐    ┌───────────┐   ┌───────────┐ │
│         │    │  Card 1   │    │  Card 2   │   │  Card 3   │ │
│         │    └───────────┘    └───────────┘   └───────────┘ │
│         │                                                   │
│ Sidebar │    ┌───────────────────────────────────────────┐  │
│         │    │                                           │  │
│         │    │                 Main Content              │  │
│         │    │                                           │  │
│         │    └───────────────────────────────────────────┘  │
│         │                                                   │
└─────────┴───────────────────────────────────────────────────┘
```

**Mobile Layout**
```
┌───────────────────────────────┐
│ Header           ☰   User    │
├───────────────────────────────┤
│                               │
│  ┌───────────────────────┐    │
│  │        Card 1         │    │
│  └───────────────────────┘    │
│                               │
│  ┌───────────────────────┐    │
│  │        Card 2         │    │
│  └───────────────────────┘    │
│                               │
│  ┌───────────────────────┐    │
│  │        Card 3         │    │
│  └───────────────────────┘    │
│                               │
│  ┌───────────────────────┐    │
│  │                       │    │
│  │     Main Content      │    │
│  │                       │    │
│  └───────────────────────┘    │
│                               │
└───────────────────────────────┘
``` 