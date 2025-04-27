"use client";

import { useState, useEffect } from 'react';
import Modal from '@/app/components/Modal';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  quantity?: number;
}

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: MenuItem | null;
  categories: string[];
}

export default function AddMenuItemModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem,
  categories
}: AddMenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: categories && categories.length > 0 ? categories[0] : '',
    price: '',
    description: '',
    isAvailable: true,
    quantity: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category,
        price: editingItem.price.toString(),
        description: editingItem.description || '',
        isAvailable: editingItem.isAvailable,
        quantity: editingItem.quantity?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        category: categories && categories.length > 0 ? categories[0] : '',
        price: '',
        description: '',
        isAvailable: true,
        quantity: ''
      });
    }
  }, [editingItem, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Giá không hợp lệ');
      }

      const endpoint = editingItem 
        ? `/api/menu/${editingItem.id}`
        : '/api/menu';

      const response = await fetch(endpoint, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Chỉnh sửa món" : "Thêm món mới"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên món *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl"
            placeholder="Nhập tên món..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục *
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá *
          </label>
          <div className="relative">
            <input
              type="number"
              required
              min="0"
              step="1000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl"
              placeholder="Nhập giá..."
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              VNĐ
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Nhập mô tả..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số lượng *
          </label>
          <input
            type="number"
            required
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl"
            placeholder="Nhập số lượng..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAvailable"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
            Đang bán
          </label>
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isSubmitting ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Thêm món'}
          </button>
        </div>
      </form>
    </Modal>
  );
} 