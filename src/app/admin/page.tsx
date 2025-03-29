'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  status: 'active' | 'inactive';
  imageUrl: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'menu'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: '',
    description: '',
    status: 'active',
    imageUrl: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleAddMenuItem = () => {
    if (newItem.name && newItem.price) {
      const item: MenuItem = {
        id: Date.now().toString(),
        ...newItem as MenuItem,
      };
      setMenuItems([...menuItems, item]);
      setIsAddDialogOpen(false);
      setNewItem({
        name: '',
        price: 0,
        category: '',
        description: '',
        status: 'active',
        imageUrl: '',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [id]: id === 'price' ? Number(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3ECDB] via-[#F3ECDB]/80 to-[#F3ECDB]">
      <div className="container mx-auto py-10 px-4">
        <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-[#3E503C] text-[#3E503C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                Quản lý người dùng
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`${
                  activeTab === 'menu'
                    ? 'border-[#3E503C] text-[#3E503C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                Quản lý menu
              </button>
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'users' ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Danh sách người dùng</h2>
              </div>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E503C]"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-4">{error}</div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-700">Tên</TableHead>
                        <TableHead className="text-gray-700">Email</TableHead>
                        <TableHead className="text-gray-700">Vai trò</TableHead>
                        <TableHead className="text-gray-700">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell className="text-gray-700">{user.fullName}</TableCell>
                          <TableCell className="text-gray-700">{user.email}</TableCell>
                          <TableCell className="text-gray-700">{user.role}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 text-gray-700 hover:text-[#3E503C] hover:border-[#3E503C]"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsChangePasswordDialogOpen(true);
                              }}
                            >
                              Đổi mật khẩu
                            </Button>
                            <Button variant="destructive" size="sm">
                              Xóa
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Change Password Dialog */}
              <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-gray-700">Đổi mật khẩu cho {selectedUser?.fullName}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword" className="text-gray-700">Mật khẩu mới</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        className="border-gray-300 focus:border-[#3E503C] focus:ring-[#3E503C]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700">Xác nhận mật khẩu</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="border-gray-300 focus:border-[#3E503C] focus:ring-[#3E503C]"
                      />
                    </div>
                    <Button 
                      onClick={() => setIsChangePasswordDialogOpen(false)}
                      className="bg-[#3E503C] hover:bg-[#7F886A] text-white"
                    >
                      Cập nhật
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Danh sách món</h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#3E503C] hover:bg-[#7F886A] text-white">
                      Thêm món mới
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-gray-700">Thêm món mới</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-gray-700">Tên món</Label>
                        <Input
                          id="name"
                          value={newItem.name}
                          onChange={handleInputChange}
                          className="border-gray-300 focus:border-[#3E503C] focus:ring-[#3E503C]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price" className="text-gray-700">Giá</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newItem.price}
                          onChange={handleInputChange}
                          className="border-gray-300 focus:border-[#3E503C] focus:ring-[#3E503C]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category" className="text-gray-700">Danh mục</Label>
                        <Input
                          id="category"
                          value={newItem.category}
                          onChange={handleInputChange}
                          className="border-gray-300 focus:border-[#3E503C] focus:ring-[#3E503C]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description" className="text-gray-700">Mô tả</Label>
                        <Input
                          id="description"
                          value={newItem.description}
                          onChange={handleInputChange}
                          className="border-gray-300 focus:border-[#3E503C] focus:ring-[#3E503C]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="imageUrl" className="text-gray-700">URL hình ảnh</Label>
                        <Input
                          id="imageUrl"
                          value={newItem.imageUrl}
                          onChange={handleInputChange}
                          className="border-gray-300 focus:border-[#3E503C] focus:ring-[#3E503C]"
                        />
                      </div>
                      <Button 
                        onClick={handleAddMenuItem}
                        className="bg-[#3E503C] hover:bg-[#7F886A] text-white"
                      >
                        Thêm món
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-gray-700">Tên món</TableHead>
                      <TableHead className="text-gray-700">Giá</TableHead>
                      <TableHead className="text-gray-700">Danh mục</TableHead>
                      <TableHead className="text-gray-700">Trạng thái</TableHead>
                      <TableHead className="text-gray-700">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-700">{item.name}</TableCell>
                        <TableCell className="text-gray-700">{item.price.toLocaleString('vi-VN')}đ</TableCell>
                        <TableCell className="text-gray-700">{item.category}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status === 'active' ? 'Đang phục vụ' : 'Ngừng phục vụ'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2 text-gray-700 hover:text-[#3E503C] hover:border-[#3E503C]"
                          >
                            Sửa
                          </Button>
                          <Button variant="destructive" size="sm">
                            Xóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 