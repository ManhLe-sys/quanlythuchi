"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  quantity: number;
  actualAvailable?: number; // Available after reservations
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface CheckoutInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: 'cod' | 'banking';
  bankingConfirmation: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'cod',
    bankingConfirmation: false,
  });
  const [orderTotal, setOrderTotal] = useState(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate a unique user ID for tracking reservations
  useEffect(() => {
    // Try to get existing userId from localStorage
    const storedUserId = localStorage.getItem('shopping_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Create a new userId if none exists
      const newUserId = uuidv4();
      localStorage.setItem('shopping_user_id', newUserId);
      setUserId(newUserId);
    }

    // Pre-fill user info if logged in
    if (user) {
      setCheckoutInfo(prev => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menu/getItems');
      
      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi tải dữ liệu');
      }
      
      const data = await response.json();

      if (data.items && Array.isArray(data.items)) {
        const formattedProducts: Product[] = data.items.map((item: any) => ({
          id: item.id || '',
          name: item.name || '',
          price: Number(item.price) || 0,
          category: item.category || '',
          description: item.description || '',
          imageUrl: item.imageUrl || 'https://via.placeholder.com/150',
          isAvailable: item.status === 'active',
          quantity: Number(item.quantity) || 0,
          actualAvailable: Number(item.quantity) || 0, // Initially the same as quantity
        }));
        setProducts(formattedProducts);
        
        // If we have a userId, update real-time availability
        if (userId) {
          updateRealTimeAvailability(formattedProducts);
        }
        
        setError(null);
      } else {
        setProducts([]);
        setError('Không có dữ liệu sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Không thể tải danh sách sản phẩm');
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update real-time availability for all products
  const updateRealTimeAvailability = async (productsList: Product[]) => {
    if (!userId) return;
    
    try {
      // Check actual availability for all products
      const availabilityChecks = await Promise.all(
        productsList.map(product => 
          fetch('/api/menu/checkStock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: product.id,
              userId,
              quantity: 0,
              action: 'check'
            })
          }).then(res => res.json())
        )
      );
      
      // Update products with actual availability
      const updatedProducts = productsList.map((product, index) => {
        const check = availabilityChecks[index];
        if (check.success) {
          return {
            ...product,
            actualAvailable: check.actualAvailable
          };
        }
        return product;
      });
      
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating real-time availability:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProducts();
      
      // Clean up reserved quantities when component unmounts
      return () => {
        releaseAllReservations();
      };
    }
  }, [userId]);

  // Release all reservations when unmounting
  const releaseAllReservations = async () => {
    if (!userId) return;
    
    try {
      await Promise.all(
        cart.map(item => 
          fetch('/api/menu/checkStock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: item.productId,
              userId,
              quantity: 0,
              action: 'release'
            })
          })
        )
      );
    } catch (error) {
      console.error('Error releasing reservations:', error);
    }
  };

  // Check and reserve stock before adding to cart
  const reserveStock = async (productId: string, requestedQuantity: number): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const response = await fetch('/api/menu/checkStock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userId,
          quantity: requestedQuantity,
          action: 'reserve'
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        toast({
          title: "Không đủ số lượng",
          description: `Chỉ còn ${data.actualAvailable} sản phẩm có sẵn`,
          variant: "destructive"
        });
        return false;
      }
      
      // Update product's actual available quantity in the local state
      setProducts(products.map(product => 
        product.id === productId
          ? { ...product, actualAvailable: data.actualAvailable }
          : product
      ));
      
      return true;
    } catch (error) {
      console.error('Error reserving stock:', error);
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra tồn kho. Vui lòng thử lại.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Release stock when removing from cart
  const releaseStock = async (productId: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/menu/checkStock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userId,
          quantity: 0,
          action: 'release'
        })
      });
      
      const data = await response.json();
      
      // Update product's actual available quantity in the local state
      setProducts(products.map(product => 
        product.id === productId
          ? { ...product, actualAvailable: data.actualAvailable }
          : product
      ));
    } catch (error) {
      console.error('Error releasing stock:', error);
    }
  };

  const addToCart = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.productId === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantity + 1;
    
    // Check if there's enough actual available stock
    if (product.actualAvailable !== undefined && newQuantity > product.actualAvailable) {
      toast({
        title: "Không đủ số lượng",
        description: `Chỉ còn ${product.actualAvailable} ${product.name} có sẵn`,
        variant: "destructive"
      });
      return;
    }
    
    // Try to reserve the stock
    const reserved = await reserveStock(productId, newQuantity);
    if (!reserved) return;
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      ));
    } else {
      setCart([...cart, { productId, quantity: 1 }]);
    }
    
    toast({
      title: "Thành công",
      description: "Đã thêm sản phẩm vào giỏ hàng",
      variant: "default"
    });
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Release reservation when removing from cart
      await releaseStock(productId);
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if there's enough actual available stock plus what's already in cart
    const existingItem = cart.find(item => item.productId === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    // Try to reserve the new quantity
    const reserved = await reserveStock(productId, quantity);
    if (!reserved) return;
    
    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity } 
        : item
    ));
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const product = getProductById(item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handleCheckoutOpen = () => {
    const total = calculateTotal();
    setOrderTotal(total);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCheckoutInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateCheckout = (): boolean => {
    setCheckoutError(null);
    
    // Basic validation
    if (!checkoutInfo.fullName.trim()) {
      setCheckoutError("Vui lòng nhập họ tên");
      return false;
    }
    
    if (!checkoutInfo.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutInfo.email)) {
      setCheckoutError("Vui lòng nhập email hợp lệ");
      return false;
    }
    
    if (!checkoutInfo.phone.trim() || !/^\d{10}$/.test(checkoutInfo.phone.replace(/\s+/g, ''))) {
      setCheckoutError("Vui lòng nhập số điện thoại hợp lệ");
      return false;
    }
    
    if (!checkoutInfo.address.trim()) {
      setCheckoutError("Vui lòng nhập địa chỉ");
      return false;
    }
    
    // For orders over 1 million VND, banking payment is required
    if (orderTotal >= 1000000) {
      if (checkoutInfo.paymentMethod !== 'banking') {
        setCheckoutError("Đơn hàng trên 1 triệu VND phải thanh toán trước qua chuyển khoản");
        return false;
      }
      
      if (!checkoutInfo.bankingConfirmation) {
        setCheckoutError("Vui lòng xác nhận đã chuyển khoản");
        return false;
      }
    }
    
    return true;
  };

  const placeOrder = async () => {
    // Final check before placing order
    for (const item of cart) {
      const product = getProductById(item.productId);
      if (!product) continue;
      
      if (product.actualAvailable !== undefined && item.quantity > product.actualAvailable) {
        toast({
          title: "Không đủ số lượng",
          description: `Chỉ còn ${product.actualAvailable} ${product.name} có sẵn`,
          variant: "destructive"
        });
        
        // Refresh product data to see updated quantities
        await fetchProducts();
        return;
      }
    }
    
    // Open checkout dialog
    handleCheckoutOpen();
  };

  const submitOrder = async () => {
    if (!validateCheckout()) {
      return;
    }
    
    try {
      // Here you would implement the order creation logic
      // including committing the reservations to actual order quantities
      // and updating the inventory in the database
      
      // Send email confirmation
      await fetch('/api/sendOrderEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: checkoutInfo.email,
          order: {
            items: cart.map(item => {
              const product = getProductById(item.productId);
              return {
                name: product?.name,
                price: product?.price,
                quantity: item.quantity,
                subtotal: product ? product.price * item.quantity : 0
              };
            }),
            customerInfo: checkoutInfo,
            total: orderTotal
          }
        })
      });
      
      toast({
        title: "Đơn hàng đã được tạo",
        description: "Cảm ơn bạn đã mua hàng! Chúng tôi đã gửi hóa đơn vào email của bạn.",
        variant: "default"
      });
      
      // Clear cart and release any uncommitted reservations
      setCart([]);
      setIsCheckoutOpen(false);
      
      // Reset checkout info except for user details
      setCheckoutInfo(prev => ({
        ...prev,
        address: '',
        paymentMethod: 'cod',
        bankingConfirmation: false,
      }));
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Có lỗi xảy ra",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Sản Phẩm</h1>
          <div className="relative">
            <Button 
              onClick={() => setIsCartOpen(true)}
              className="px-6 py-3 bg-white text-[#3E503C] rounded-xl hover:bg-[#F3ECDB] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Giỏ hàng ({cart.reduce((total, item) => total + item.quantity, 0)})
            </Button>
          </div>
        </div>
      </div>

      {/* Shopping Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-0 max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#3E503C]">Giỏ hàng của bạn</DialogTitle>
          </DialogHeader>
          
          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-24 w-24 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Giỏ hàng trống</h3>
              <p className="text-gray-500 mb-6">Bạn chưa thêm sản phẩm nào vào giỏ hàng</p>
              <Button 
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 bg-[#7F886A] text-white rounded-xl hover:bg-[#3E503C] transition-all duration-200"
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          ) : (
            <>
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                {cart.map((item) => {
                  const product = getProductById(item.productId);
                  if (!product) return null;
                  
                  return (
                    <div key={item.productId} className="flex items-center space-x-4 py-4 border-b border-gray-100">
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-700">{product.name}</h4>
                        <p className="text-[#3E503C] font-semibold">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(product.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Còn lại: {product.actualAvailable !== undefined 
                            ? `${product.actualAvailable + item.quantity} (${product.actualAvailable} có sẵn)` 
                            : product.quantity}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-8 w-8 rounded-full"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                          </svg>
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={product.quantity}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-14 text-center h-8 rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="h-8 w-8 rounded-full"
                          disabled={product.actualAvailable !== undefined 
                            ? item.quantity >= (product.actualAvailable + item.quantity)
                            : item.quantity >= product.quantity}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12M6 12h12" />
                          </svg>
                        </Button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-bold text-[#3E503C]">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Tổng tiền:</span>
                  <span className="text-xl font-bold text-[#3E503C]">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(calculateTotal())}
                  </span>
                </div>
              </div>
              
              <DialogFooter className="flex space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-xl flex-1 hover:bg-gray-50"
                >
                  Tiếp tục mua sắm
                </Button>
                <Button
                  onClick={placeOrder}
                  className="rounded-xl flex-1 bg-[#7F886A] hover:bg-[#3E503C] text-white transition-colors"
                >
                  Đặt hàng ngay
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-0 max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#3E503C]">Thông tin đặt hàng</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-gray-700">Họ tên</Label>
                <Input 
                  id="fullName"
                  name="fullName"
                  value={checkoutInfo.fullName}
                  onChange={handleCheckoutInputChange}
                  placeholder="Nhập họ tên của bạn"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  value={checkoutInfo.email}
                  onChange={handleCheckoutInputChange}
                  placeholder="Nhập email của bạn"
                />
                <p className="text-xs text-gray-500">Hóa đơn sẽ được gửi vào email này</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-gray-700">Số điện thoại</Label>
                <Input 
                  id="phone"
                  name="phone"
                  value={checkoutInfo.phone}
                  onChange={handleCheckoutInputChange}
                  placeholder="Nhập số điện thoại của bạn"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-gray-700">Địa chỉ</Label>
                <Input 
                  id="address"
                  name="address"
                  value={checkoutInfo.address}
                  onChange={handleCheckoutInputChange}
                  placeholder="Nhập địa chỉ nhận hàng của bạn"
                />
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Phương thức thanh toán</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paymentCod"
                      name="paymentMethod"
                      value="cod"
                      checked={checkoutInfo.paymentMethod === 'cod'}
                      onChange={handleCheckoutInputChange}
                      className="w-4 h-4"
                      disabled={orderTotal >= 1000000}
                    />
                    <Label htmlFor="paymentCod" className="text-gray-700">Thanh toán khi nhận hàng (COD)</Label>
                  </div>
                  
                  {orderTotal >= 1000000 && (
                    <p className="text-sm text-red-500 ml-6">
                      Đơn hàng trên 1 triệu VND phải thanh toán trước qua chuyển khoản
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paymentBanking"
                      name="paymentMethod"
                      value="banking"
                      checked={checkoutInfo.paymentMethod === 'banking'}
                      onChange={handleCheckoutInputChange}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="paymentBanking" className="text-gray-700">Chuyển khoản ngân hàng</Label>
                  </div>
                  
                  {checkoutInfo.paymentMethod === 'banking' && (
                    <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold mb-1 text-gray-700">Thông tin chuyển khoản:</p>
                      <p className="text-gray-700">Ngân hàng: <span className="font-medium">BIDV</span></p>
                      <p className="text-gray-700">Số tài khoản: <span className="font-medium">1234567890</span></p>
                      <p className="text-gray-700">Chủ tài khoản: <span className="font-medium">Nguyễn Văn A</span></p>
                      <p className="mt-2 text-gray-700">Nội dung: <span className="font-medium">DH {userId.slice(-6)}</span></p>
                      
                      <div className="mt-4 flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="bankingConfirmation"
                          name="bankingConfirmation"
                          checked={checkoutInfo.bankingConfirmation}
                          onChange={handleCheckoutInputChange}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="bankingConfirmation" className="text-gray-700">
                          Tôi đã chuyển khoản thành công
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-medium text-gray-700">Tổng thanh toán:</span>
                  <span className="text-xl font-bold text-[#3E503C]">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(orderTotal)}
                  </span>
                </div>
              </div>
              
              {checkoutError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600">
                  {checkoutError}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCheckoutOpen(false);
                setIsCartOpen(true);
              }}
              className="rounded-xl flex-1 hover:bg-gray-50"
            >
              Quay lại giỏ hàng
            </Button>
            <Button
              onClick={submitOrder}
              className="rounded-xl flex-1 bg-[#7F886A] hover:bg-[#3E503C] text-white transition-colors"
            >
              Xác nhận đặt hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-12 text-center">
          <div className="h-24 w-24 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-12 text-center">
          <div className="h-24 w-24 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
          <p className="text-gray-500">Hiện tại không có sản phẩm nào được hiển thị</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id}
              className="bg-white/80 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="h-48 bg-gray-100 relative overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                {(!product.isAvailable || 
                  product.quantity === 0 || 
                  (product.actualAvailable !== undefined && product.actualAvailable <= 0)) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg">
                      Hết hàng
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-1 line-clamp-2">{product.description}</p>
                <p className="text-sm text-gray-500 mb-3">
                  Còn lại: {product.actualAvailable !== undefined 
                    ? `${product.quantity} (${product.actualAvailable} có sẵn)` 
                    : product.quantity}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-[#3E503C]">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(product.price)}
                  </p>
                  <Button
                    onClick={() => addToCart(product.id)}
                    disabled={!product.isAvailable || 
                              product.quantity === 0 || 
                              (product.actualAvailable !== undefined && product.actualAvailable <= 0)}
                    className="rounded-xl bg-[#7F886A] hover:bg-[#3E503C] text-white transition-colors"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Thêm
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 