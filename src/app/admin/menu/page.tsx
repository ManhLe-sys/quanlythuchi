"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl: string;
  quantity: number;
  status: 'active' | 'inactive';
}

export default function AdminMenuPage() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();

  const categories = [
    "Đồ uống",
    "Món chính",
    "Món phụ",
    "Tráng miệng",
    "Khác"
  ];

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/menu/getItems');
      
      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi tải dữ liệu');
      }
      
      const data = await response.json();

      let filteredItems = data.items || [];
      if (selectedCategory) {
        filteredItems = filteredItems.filter(
          (item: MenuItem) => item.category === selectedCategory
        );
      }

      setMenuItems(filteredItems);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thực đơn",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  const handleToggleStatus = async (itemId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`/api/menu/updateItem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: itemId, 
          status: newStatus 
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể cập nhật trạng thái');
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái món",
        variant: "default"
      });

      // Refresh the menu items
      fetchMenuItems();
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái món",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Quản Lý Thực Đơn</h1>
            <p className="text-white/80">
              Quản lý danh sách món và giá trong thực đơn
            </p>
          </div>
          <div>
            <Link href="/admin/menu/add">
              <Button className="px-6 py-3 bg-white text-[#3E503C] rounded-xl hover:bg-[#3E503C]/10 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm Món Mới
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              selectedCategory === ""
                ? 'bg-[#3E503C] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-[#3E503C] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E503C]"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700">{error}</p>
            <button
              onClick={fetchMenuItems}
              className="mt-4 px-4 py-2 bg-[#3E503C] text-white rounded-xl hover:bg-[#7F886A] transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700">Không có món nào</p>
            <Link href="/admin/menu/add">
              <Button className="mt-4 px-4 py-2 bg-[#3E503C] text-white rounded-xl hover:bg-[#7F886A] transition-colors">
                Thêm món mới
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tên món</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Danh mục</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Giá</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Tồn kho</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={item.imageUrl || '/placeholder-food.jpg'} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.category}</td>
                    <td className="px-6 py-4 text-right text-[#3E503C] font-medium">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(item.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.quantity > 10 
                          ? 'bg-green-100 text-green-800' 
                          : item.quantity > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          item.status === 'active' ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle status</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            item.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/admin/menu/edit/${item.id}`} className="text-blue-500 hover:text-blue-700 mx-1">
                        <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 