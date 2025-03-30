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
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
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
  const { toast } = useToast();
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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<'admin' | 'staff' | 'customer'>('customer');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/getUsers');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.users);
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!selectedUser) return;

    try {
      // Hash mật khẩu với salt rounds là 10
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const response = await fetch('/api/users/changePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedUser.email,
          newPassword: hashedPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      setIsChangePasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật mật khẩu thành công",
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('Có lỗi xảy ra khi đổi mật khẩu');
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật mật khẩu. Vui lòng thử lại sau.",
      });
    }
  };

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch('/api/users/deleteUser', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userToDelete.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      const updatedUsers = users.filter(u => u.email !== userToDelete.email);
      setUsers(updatedUsers);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      toast({
        title: "Thành công",
        description: "Đã xóa tài khoản thành công",
      });
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa tài khoản. Vui lòng thử lại sau.",
      });
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/users/changeRole', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedUser.email,
          newRole: currentRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change role');
      }

      // Cập nhật danh sách người dùng với vai trò mới
      setUsers(users.map(user => 
        user.email === selectedUser.email 
          ? { ...user, role: currentRole }
          : user
      ));

      setIsChangeRoleDialogOpen(false);
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò thành công",
      });
    } catch (err) {
      console.error('Error changing role:', err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật vai trò. Vui lòng thử lại sau.",
      });
    }
  };

  // Hàm để hiển thị tên vai trò đẹp hơn
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'staff':
        return 'Nhân viên';
      case 'customer':
        return 'Khách hàng';
      default:
        return role;
    }
  };

  return (
    <>
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
                          <TableHead className="text-[#3E503C]">Tên</TableHead>
                          <TableHead className="text-[#3E503C]">Email</TableHead>
                          <TableHead className="text-[#3E503C]">Vai trò</TableHead>
                          <TableHead className="text-[#3E503C]">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="text-gray-700">{user.fullName}</TableCell>
                            <TableCell className="text-gray-700">{user.email}</TableCell>
                            <TableCell className="text-gray-700">{getRoleDisplay(user.role)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2 bg-[#3E503C] hover:bg-[#7F886A] text-white border-[#3E503C]"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setCurrentRole(user.role);
                                  setIsChangeRoleDialogOpen(true);
                                }}
                              >
                                Đổi vai trò
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2 bg-[#3E503C] hover:bg-[#7F886A] text-white border-[#3E503C]"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsChangePasswordDialogOpen(true);
                                }}
                              >
                                Đổi mật khẩu
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                onClick={() => handleDeleteUser(user)}
                              >
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
                  <DialogContent className="bg-white border-[#3E503C]/20">
                    <DialogHeader>
                      <DialogTitle className="text-[#3E503C]">Đổi mật khẩu cho {selectedUser?.fullName}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="newPassword" className="text-[#3E503C]">Mật khẩu mới</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword" className="text-[#3E503C]">Xác nhận mật khẩu</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                        />
                      </div>
                      {passwordError && (
                        <div className="text-red-500 text-sm">{passwordError}</div>
                      )}
                      <Button 
                        onClick={handleChangePassword}
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
                    <DialogContent className="bg-white border-[#3E503C]/20">
                      <DialogHeader>
                        <DialogTitle className="text-[#3E503C]">Thêm món mới</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name" className="text-[#3E503C]">Tên món</Label>
                          <Input
                            id="name"
                            value={newItem.name}
                            onChange={handleInputChange}
                            className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price" className="text-[#3E503C]">Giá</Label>
                          <Input
                            id="price"
                            type="number"
                            value={newItem.price}
                            onChange={handleInputChange}
                            className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category" className="text-[#3E503C]">Danh mục</Label>
                          <Input
                            id="category"
                            value={newItem.category}
                            onChange={handleInputChange}
                            className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description" className="text-[#3E503C]">Mô tả</Label>
                          <Input
                            id="description"
                            value={newItem.description}
                            onChange={handleInputChange}
                            className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="imageUrl" className="text-[#3E503C]">URL hình ảnh</Label>
                          <Input
                            id="imageUrl"
                            value={newItem.imageUrl}
                            onChange={handleInputChange}
                            className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
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
                        <TableHead className="text-[#3E503C]">Tên món</TableHead>
                        <TableHead className="text-[#3E503C]">Giá</TableHead>
                        <TableHead className="text-[#3E503C]">Danh mục</TableHead>
                        <TableHead className="text-[#3E503C]">Trạng thái</TableHead>
                        <TableHead className="text-[#3E503C]">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="text-gray-600">{item.name}</TableCell>
                          <TableCell className="text-gray-600">{item.price.toLocaleString('vi-VN')}đ</TableCell>
                          <TableCell className="text-gray-600">{item.category}</TableCell>
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
                              className="mr-2 bg-[#3E503C] hover:bg-[#7F886A] text-white border-[#3E503C]"
                            >
                              Sửa
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                            >
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-[#3E503C]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#3E503C]">Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Bạn có chắc chắn muốn xóa tài khoản của {userToDelete?.fullName}? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-red-600">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="bg-white border-[#3E503C]/20">
          <DialogHeader>
            <DialogTitle className="text-[#3E503C]">Đổi vai trò cho {selectedUser?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role" className="text-[#3E503C]">Vai trò mới</Label>
              <select
                id="role"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as 'admin' | 'staff' | 'customer')}
                className="w-full px-3 py-2 border rounded-md border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C] text-gray-700"
              >
                <option value="admin">Quản trị viên</option>
                <option value="staff">Nhân viên</option>
                <option value="customer">Khách hàng</option>
              </select>
            </div>
            <Button 
              onClick={handleChangeRole}
              className="bg-[#3E503C] hover:bg-[#7F886A] text-white"
            >
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 