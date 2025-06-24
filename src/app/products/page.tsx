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
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from '../contexts/LanguageContext';

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
  status: 'active' | 'inactive';
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
  paymentMethod: 'cod' | 'banking' | 'momo';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { translate, language } = useLanguage();

  // Import MomoPaymentButton
  const MomoPaymentButton = dynamic(() => import('@/components/MomoPaymentButton'), { ssr: false });

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
        throw new Error(translate('loi_tai_du_lieu') || 'Có lỗi xảy ra khi tải dữ liệu');
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
          status: item.status || 'inactive',
        }));
        setProducts(formattedProducts);
        
        // If we have a userId, update real-time availability
        if (userId) {
          updateRealTimeAvailability(formattedProducts);
        }
        
        setError(null);
      } else {
        setProducts([]);
        setError(translate('khong_co_du_lieu_san_pham') || 'Không có dữ liệu sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(translate('khong_the_tai_ds_sp') || 'Không thể tải danh sách sản phẩm');
      toast({
        title: translate('loi') || "Lỗi",
        description: translate('khong_the_tai_ds_sp') || "Không thể tải danh sách sản phẩm",
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
      // Special case handling for exactly 1 item available
      const product = products.find(p => p.id === productId);
      if (product && product.actualAvailable === 1 && requestedQuantity === 1) {
        // Allow adding a single item when exactly 1 is available
        // Update product's actual available quantity locally to prevent further additions
        setProducts(products.map(p => 
          p.id === productId ? { ...p, actualAvailable: 0 } : p
        ));
        
        // We're handling this special case locally
        return true;
      }
      
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
      // Create order items from cart
      const orderItems = cart.map((item, index) => {
        const product = getProductById(item.productId);
        return {
          stt: index + 1,
          ma_mon: item.productId,
          ten_mon: product?.name || "",
          don_vi_tinh: "Cái",
          so_luong: item.quantity,
          don_gia: product?.price || 0,
          thanh_tien: (product?.price || 0) * item.quantity,
          ghi_chu: ""
        };
      });

      // Create order data
      const orderData = {
        ma_don: `DH${Date.now()}`,
        ngay_dat: new Date().toISOString().split("T")[0],
        ngay_giao: new Date().toISOString().split("T")[0], // Same day delivery for now
        ten_khach: checkoutInfo.fullName,
        so_dien_thoai: checkoutInfo.phone,
        dia_chi: checkoutInfo.address,
        tong_tien: orderTotal,
        trang_thai: "Chờ xử lý",
        trang_thai_thanh_toan: checkoutInfo.paymentMethod === 'cod' ? 'Chưa thanh toán' : 'Đã thanh toán',
        phuong_thuc_thanh_toan: checkoutInfo.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 
                                checkoutInfo.paymentMethod === 'banking' ? 'Chuyển khoản ngân hàng' : 'MoMo',
        ghi_chu: `Email: ${checkoutInfo.email}`,
        id_nguoi_tao: user?.email || userId || "GUEST",
        thoi_gian_tao: new Date().toISOString(),
        thoi_gian_cap_nhat: new Date().toISOString(),
        danh_sach_mon: orderItems
      };

      // Save order to database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Có lỗi xảy ra khi tạo đơn hàng');
      }
      
      const orderResult = await orderResponse.json();
      
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
            total: orderTotal,
            orderCode: orderResult.data?.ma_don || orderData.ma_don
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

  const handleMomoPayment = async (orderId: string): Promise<string | null> => {
    // Validate checkout information
    if (!validateCheckout()) {
      return null;
    }
    
    try {
      // Use provided orderId or generate one if not provided
      const momoOrderId = orderId || `ORDER_${Date.now()}`;
      
      // Create order items from cart
      const orderItems = cart.map((item, index) => {
        const product = getProductById(item.productId);
        return {
          stt: index + 1,
          ma_mon: item.productId,
          ten_mon: product?.name || "",
          don_vi_tinh: "Cái",
          so_luong: item.quantity,
          don_gia: product?.price || 0,
          thanh_tien: (product?.price || 0) * item.quantity,
          ghi_chu: ""
        };
      });

      // Create a new order in the database
      const orderData = {
        ma_don: momoOrderId,
        ngay_dat: new Date().toISOString().split("T")[0],
        ngay_giao: new Date().toISOString().split("T")[0], // Same day delivery for now
        ten_khach: checkoutInfo.fullName,
        so_dien_thoai: checkoutInfo.phone,
        dia_chi: checkoutInfo.address,
        tong_tien: orderTotal,
        trang_thai: "Chờ xử lý",
        trang_thai_thanh_toan: 'Đang xử lý',
        phuong_thuc_thanh_toan: 'MoMo',
        ghi_chu: `Email: ${checkoutInfo.email}`,
        id_nguoi_tao: user?.email || userId || "GUEST",
        thoi_gian_tao: new Date().toISOString(),
        thoi_gian_cap_nhat: new Date().toISOString(),
        danh_sach_mon: orderItems
      };

      // Save order to database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Có lỗi xảy ra khi tạo đơn hàng');
      }
      
      // Return the order ID for MoMo payment
      return momoOrderId;
    } catch (error) {
      console.error('Error preparing MoMo payment:', error);
      setCheckoutError("Có lỗi xảy ra khi chuẩn bị thanh toán. Vui lòng thử lại sau.");
      return null;
    }
  };

  // Filter products based on search query and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || product.category === activeCategory;
    return matchesSearch && matchesCategory && product.status === 'active';
  });

  // Extract unique categories
  const categories = [...new Set(products.map(product => product.category))];

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Fixed Cart Button */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed top-24 right-6 z-30 bg-white text-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all group border border-gray-200"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-gray-700 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border border-gray-200">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </div>
        <span className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 px-2 py-1 rounded text-sm font-medium shadow-md invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 whitespace-nowrap border border-gray-200">
          Giỏ hàng của bạn
        </span>
      </button>

      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{translate('san_pham')}</h1>
            <p className="text-white/80">
              {translate('san_pham_desc')}
            </p>
          </div>
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder={`${translate('tim_kiem')}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 pl-12 rounded-xl bg-white/80 backdrop-blur-sm border-transparent focus:border-white focus:ring-2 focus:ring-white transition-all duration-300 shadow-sm"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 pb-2 min-w-max">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeCategory === null
                ? 'bg-white/90 text-[#3E503C] shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {translate('tat_ca')}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-white/90 text-[#3E503C] shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Shopping Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-0 max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-700">
              {translate('gio_hang') || 'Giỏ Hàng'}
            </DialogTitle>
          </DialogHeader>
          
          {cart.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-700 mb-4">{translate('gio_hang_trong') || 'Giỏ hàng của bạn đang trống'}</p>
              <Button 
                onClick={() => setIsCartOpen(false)} 
                className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
              >
                {translate('tiep_tuc_mua_hang') || 'Tiếp tục mua hàng'}
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
                        <p className="text-gray-700 font-semibold">
                          {new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', {
                            style: 'currency',
                            currency: language === 'en' ? 'USD' : 'VND'
                          }).format(product.price)}
                        </p>
                        <p className="text-sm text-gray-700">
                          {translate('con_lai') || 'Còn lại'}: {product.quantity} {product.actualAvailable !== undefined && (
                            product.actualAvailable === 1 ? 
                            <span className="text-gray-700 font-medium">({translate('chi_con_1') || 'Chỉ còn 1 có sẵn'})</span> : 
                            `(${product.actualAvailable} ${translate('co_san') || 'có sẵn'})`
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-8 w-8 rounded-full bg-white text-gray-700 border-gray-300"
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
                          className="w-14 text-center h-8 rounded-lg text-gray-700"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="h-8 w-8 rounded-full bg-white text-gray-700 border-gray-300"
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
                        <p className="font-bold text-gray-700">
                          {new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', {
                            style: 'currency',
                            currency: language === 'en' ? 'USD' : 'VND'
                          }).format(product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-700">{translate('tong_cong') || 'Tổng cộng'}:</span>
                  <span className="text-gray-700">
                    {new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', {
                      style: 'currency',
                      currency: language === 'en' ? 'USD' : 'VND'
                    }).format(calculateTotal())}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsCartOpen(false)} 
                    variant="outline" 
                    className="flex-1 bg-white text-gray-700 border-gray-300"
                  >
                    {translate('tiep_tuc_mua_hang') || 'Tiếp tục mua hàng'}
                  </Button>
                  <Button 
                    onClick={placeOrder} 
                    className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                  >
                    {translate('thanh_toan') || 'Thanh toán'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-0 max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-700">Thông tin đặt hàng</DialogTitle>
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
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paymentMomo"
                      name="paymentMethod"
                      value="momo"
                      checked={checkoutInfo.paymentMethod === 'momo'}
                      onChange={handleCheckoutInputChange}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="paymentMomo" className="text-gray-700">Thanh toán qua MoMo</Label>
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
                  <span className="text-xl font-bold text-gray-700">
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
              className="rounded-xl flex-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            >
              Quay lại giỏ hàng
            </Button>
            
            {checkoutInfo.paymentMethod === 'momo' ? (
              <MomoPaymentButton 
                amount={orderTotal}
                orderId={`ORDER_${Date.now()}`}
                orderInfo={`Thanh toán đơn hàng`}
                className="flex-1"
                onOrderCreated={handleMomoPayment}
              />
            ) : (
              <Button
                onClick={submitOrder}
                className="rounded-xl flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 transition-colors"
              >
                Xác nhận đặt hàng
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl shadow-md overflow-hidden animate-pulse">
              <div className="h-40 sm:h-48 bg-gray-200"></div>
              <div className="p-4 sm:p-5 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-1">{translate('khong_tim_thay_sp')}</h3>
          <p className="text-gray-500">{translate('thu_tim_kiem_khac')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl group h-full flex flex-col"
            >
              <div className="h-40 sm:h-48 relative overflow-hidden">
                <img 
                  src={product.imageUrl || '/placeholder-product.jpg'} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent h-24 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-700 line-clamp-2">{product.name}</h3>
                  <span className="px-2 py-1 bg-white text-gray-700 text-xs font-medium rounded-md ml-2 flex-shrink-0 border border-gray-200">
                    {product.category}
                  </span>
                </div>
                <p className="text-gray-700 text-sm line-clamp-2 mb-3">{product.description}</p>
                <p className="text-gray-700 text-sm mb-2">
                  {translate('con_lai') || 'Còn lại'}: {product.quantity} {product.actualAvailable !== undefined && (
                    product.actualAvailable === 1 ? 
                    <span className="text-gray-700 font-medium">({translate('chi_con_1') || 'Chỉ còn 1 có sẵn'})</span> : 
                    `(${product.actualAvailable} ${translate('co_san') || 'có sẵn'})`
                  )}
                </p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-lg sm:text-xl font-bold text-gray-700">
                    {new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', {
                      style: 'currency',
                      currency: language === 'en' ? 'USD' : 'VND'
                    }).format(product.price)}
                  </span>
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      onClick={() => addToCart(product.id)}
                      disabled={!product.isAvailable || 
                                product.quantity === 0 || 
                                (product.actualAvailable !== undefined && product.actualAvailable < 1)}
                      className="p-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-300 transition-colors text-sm font-medium"
                      title={!product.isAvailable ? translate('sp_ko_san_sang') || "Sản phẩm không có sẵn" :
                             product.quantity === 0 ? translate('het_hang') || "Hết hàng" :
                             (product.actualAvailable !== undefined && product.actualAvailable < 1) ? translate('het_hang') || "Hết hàng" : translate('them_vao_gio') || "Thêm vào giỏ hàng"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </Button>
                    <Button
                      onClick={() => {
                        addToCart(product.id);
                        setIsCartOpen(true);
                      }}
                      disabled={!product.isAvailable || 
                                product.quantity === 0 || 
                                (product.actualAvailable !== undefined && product.actualAvailable < 1)}
                      className="px-2 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-300 transition-colors text-sm font-medium whitespace-nowrap"
                      title={!product.isAvailable ? translate('sp_ko_san_sang') || "Sản phẩm không có sẵn" :
                             product.quantity === 0 ? translate('het_hang') || "Hết hàng" :
                             (product.actualAvailable !== undefined && product.actualAvailable < 1) ? translate('het_hang') || "Hết hàng" : translate('mua_ngay') || "Mua ngay"}
                    >
                      {translate('mua_ngay') || 'Mua ngay'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 