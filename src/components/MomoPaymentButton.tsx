'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface MomoPaymentButtonProps {
  amount: number;
  orderId: string;
  orderInfo: string;
  className?: string;
  onOrderCreated?: (orderId: string) => Promise<string | null>;
}

export default function MomoPaymentButton({ 
  amount, 
  orderId, 
  orderInfo, 
  className,
  onOrderCreated 
}: MomoPaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleMomoPayment = async () => {
    try {
      setLoading(true);
      
      // If there's an onOrderCreated callback, invoke it first to create order in database
      let finalOrderId = orderId;
      if (onOrderCreated) {
        const result = await onOrderCreated(orderId);
        if (result) {
          finalOrderId = result;
        } else {
          // If order creation failed, stop the payment process
          setLoading(false);
          return;
        }
      }
      
      const response = await fetch('/api/payment/create-momo-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          orderId: finalOrderId,
          orderInfo: orderInfo || `Thanh toán đơn hàng ${finalOrderId}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create MoMo payment URL');
      }
      
      const data = await response.json();
      
      if (data.payUrl) {
        // Redirect to MoMo payment page
        window.location.href = data.payUrl;
      } else {
        throw new Error('Missing payment URL in response');
      }
    } catch (error) {
      console.error('Error creating MoMo payment:', error);
      setLoading(false);
      // You could show an error message here
    }
  };

  return (
    <Button
      onClick={handleMomoPayment}
      disabled={loading}
      className={`rounded-xl text-white transition-colors ${className}`}
      style={{ backgroundColor: '#a50064', borderColor: '#a50064' }}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang xử lý
        </>
      ) : (
        <>
          <img 
            src="/momo-icon.svg" 
            alt="MoMo" 
            className="mr-2 h-5 w-5"
          />
          Thanh toán MoMo
        </>
      )}
    </Button>
  );
} 