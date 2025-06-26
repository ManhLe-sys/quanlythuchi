'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

function MomoReturnContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    
    if (!resultCode || !orderId) {
      setStatus('error');
      setMessage('Không tìm thấy thông tin thanh toán');
      return;
    }
    
    if (resultCode === '0') {
      setStatus('success');
      setMessage(`Thanh toán thành công. Mã đơn hàng: ${orderId}, Số tiền: ${parseInt(amount || '0').toLocaleString('vi-VN')} VND`);
      
      // Here you can call an API to update the order status in your database
      // e.g., fetch('/api/orders/updateStatus', { method: 'POST', body: JSON.stringify({ orderId, status: 'Đã thanh toán' }) })
    } else {
      setStatus('error');
      setMessage(`Thanh toán thất bại. Mã lỗi: ${resultCode}`);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto py-10 flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#3E503C]">Kết quả thanh toán MoMo</CardTitle>
          <CardDescription className="text-gray-700">
            {status === 'loading' && 'Vui lòng chờ trong giây lát...'}
            {status === 'success' && 'Cảm ơn bạn đã thanh toán'}
            {status === 'error' && 'Đã xảy ra lỗi'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {status === 'loading' ? (
              <Loader2 className="h-16 w-16 text-[#7F886A] animate-spin" />
            ) : status === 'success' ? (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <p className="text-center text-gray-700">{message}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={() => router.push('/')}
            className="rounded-xl bg-[#7F886A] hover:bg-[#3E503C] text-white transition-colors"
          >
            Trở về trang chủ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function MomoReturn() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-0">
          <CardContent className="flex flex-col items-center space-y-4 py-8">
            <Loader2 className="h-16 w-16 text-[#7F886A] animate-spin" />
            <p className="text-center text-gray-700">Đang tải...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <MomoReturnContent />
    </Suspense>
  );
} 