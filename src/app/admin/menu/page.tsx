"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import AddMenuItemModal from "./components/AddMenuItemModal";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminMenuPage() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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
      const response = await fetch('/api/menu');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tải dữ liệu');
      }

      let filteredItems = data.menuItems;
      if (selectedCategory) {
        filteredItems = filteredItems.filter(
          (item: MenuItem) => item.category === selectedCategory
        );
      }

      setMenuItems(filteredItems);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này');
      return;
    }
    fetchMenuItems();
  }, [user, selectedCategory]);

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Không thể cập nhật trạng thái');
      }

      await fetchMenuItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };

  return (
    <ProtectedRoute>
      <div className="page-container">
        <div className="page-header">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-purple-600">Quản Lý</span>{" "}
              <span className="text-gray-800">Menu</span>
            </h1>
            <p className="text-gray-600">
              Quản lý danh sách món và giá trong menu
            </p>
          </div>
        </div>

        {/* Actions and Filters */}
        <div className="glass-card p-6 rounded-3xl mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowAddModal(true);
              }}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm món mới
              </span>
            </button>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Tên món</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Danh mục</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Giá</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Trạng thái</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : menuItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Không có món nào trong menu
                    </td>
                  </tr>
                ) : (
                  menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(item.price)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.isAvailable ? 'Đang bán' : 'Ngừng bán'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        <AddMenuItemModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingItem(null);
            fetchMenuItems();
          }}
          editingItem={editingItem}
          categories={categories}
        />
      </div>
    </ProtectedRoute>
  );
} 