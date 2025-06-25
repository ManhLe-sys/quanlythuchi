"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem>({} as MenuItem);

  const categories = [
    "Đồ uống",
    "Món chính",
    "Món phụ",
    "Tráng miệng",
    "Khác"
  ];

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === "" || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

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

  const handleEdit = (item: MenuItem) => {
    setEditItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: MenuItem) => {
    setEditItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/menu/updateItem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: editItem.id, 
          name: editItem.name,
          price: editItem.price,
          category: editItem.category,
          quantity: editItem.quantity,
          status: editItem.status
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể cập nhật món ăn');
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật món ăn",
        variant: "default"
      });

      // Refresh the menu items
      fetchMenuItems();
      setIsEditDialogOpen(false);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật món ăn",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/menu/deleteItem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: editItem.id 
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể xóa món ăn');
      }

      toast({
        title: "Thành công",
        description: "Đã xóa món ăn",
        variant: "default"
      });

      // Refresh the menu items
      fetchMenuItems();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa món ăn",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-slate-900 text-slate-200">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 mb-8 shadow-lg border border-slate-700/50">
        <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">Quản Lý Thực Đơn</h1>
            <p className="text-slate-400">
              Quản lý danh sách món và giá trong thực đơn
            </p>
          </div>
          <div>
            <Link href="/admin/menu/add">
              <Button className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium">
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
      <div className="bg-slate-800/50 backdrop-blur-xl shadow-lg rounded-3xl border border-slate-700/50 p-6 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              selectedCategory === ""
                ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
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
                  ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="bg-slate-800/50 backdrop-blur-xl shadow-lg rounded-3xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-xl bg-slate-900/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Tên món</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Danh mục</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">Giá</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Tồn kho</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Trạng thái</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4 text-rose-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{error}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p>Không tìm thấy món ăn nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{item.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-slate-300">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(item.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-slate-300">{item.quantity || 0}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20'
                      }`}>
                        {item.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          Sửa
                        </Button>
                        <Button
                          onClick={() => handleDelete(item)}
                          className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors"
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
          <div className="text-sm text-slate-400">
            Trang {currentPage} / {Math.ceil(filteredItems.length / itemsPerPage)}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
            >
              Trang trước
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredItems.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage)}
              className="px-3 py-1 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">Chỉnh sửa món ăn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Tên món</Label>
              <Input
                id="name"
                value={editItem.name}
                onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập tên món"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-slate-300">Giá</Label>
              <Input
                id="price"
                type="number"
                value={editItem.price}
                onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập giá"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-300">Danh mục</Label>
              <Input
                id="category"
                value={editItem.category}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập danh mục"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-slate-300">Số lượng</Label>
              <Input
                id="quantity"
                type="number"
                value={editItem.quantity}
                onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value) })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập số lượng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-300">Trạng thái</Label>
              <Select value={editItem.status} onValueChange={(value: any) => setEditItem({ ...editItem, status: value })}>
                <SelectTrigger className="w-full rounded-xl bg-slate-900/50 text-slate-200 border-slate-600 hover:bg-slate-800/50">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-slate-200">
                  <SelectItem value="active" className="text-slate-200 hover:bg-slate-700">Đang bán</SelectItem>
                  <SelectItem value="inactive" className="text-slate-200 hover:bg-slate-700">Ngừng bán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg"
            >
              {isLoading ? 'Đang xử lý...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-slate-100">Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Bạn có chắc chắn muốn xóa món ăn này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="rounded-xl bg-rose-500 text-white hover:bg-rose-600"
            >
              {isLoading ? 'Đang xử lý...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 