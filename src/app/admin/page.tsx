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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'STAFF' | 'customer';
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
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'STAFF' | 'customer'>('all');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isChangePasswordLoading, setIsChangePasswordLoading] = useState(false);
  const [isChangeRoleLoading, setIsChangeRoleLoading] = useState(false);
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
  const [currentRole, setCurrentRole] = useState<'admin' | 'STAFF' | 'customer'>('customer');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [editItem, setEditItem] = useState({
    name: '',
    price: 0,
    category: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    imageUrl: ''
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
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

  const fetchMenuItems = async () => {
    try {
      setIsMenuLoading(true);
      const response = await fetch('/api/menu/getItems');
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setMenuItems(data.items);
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsMenuLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'menu') {
      fetchMenuItems();
    }
  }, [activeTab]);

  const handleAddMenuItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    try {
      const response = await fetch('/api/menu/addItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        throw new Error('Failed to add menu item');
      }

      const data = await response.json();
      setMenuItems([...menuItems, data.item]);
      setIsAddDialogOpen(false);
      setNewItem({
        name: '',
        price: 0,
        category: '',
        description: '',
        status: 'active',
        imageUrl: '',
      });
      
      toast({
        title: "Thành công",
        description: "Đã thêm món mới thành công",
      });
    } catch (err) {
      console.error('Error adding menu item:', err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm món mới. Vui lòng thử lại sau.",
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
      setIsChangePasswordLoading(true);
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
    } finally {
      setIsChangePasswordLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleteLoading(true);
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

      await fetchUsers();
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
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    try {
      setIsChangeRoleLoading(true);
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

      await fetchUsers();
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
    } finally {
      setIsChangeRoleLoading(false);
    }
  };

  // Hàm để hiển thị tên vai trò đẹp hơn
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'STAFF':
        return 'Nhân viên';
      case 'customer':
        return 'Khách hàng';
      default:
        return role;
    }
  };

  // Filter users based on search query and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handleEditMenuItem = async () => {
    if (!selectedMenuItem || !editItem.name || !editItem.price || !editItem.category) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    try {
      const response = await fetch('/api/menu/updateItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedMenuItem.id,
          ...editItem
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update menu item');
      }

      const data = await response.json();
      setMenuItems(menuItems.map(item => 
        item.id === selectedMenuItem.id ? data.item : item
      ));
      setIsEditDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Đã cập nhật món thành công",
      });
    } catch (err) {
      console.error('Error updating menu item:', err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật món. Vui lòng thử lại sau.",
      });
    }
  };

  const handleDeleteMenuItem = async (item: MenuItem) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món này không?')) {
      return;
    }

    try {
      const response = await fetch('/api/menu/deleteItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: item.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      const data = await response.json();
      setMenuItems(menuItems.filter(i => i.id !== data.deletedId));
      toast({
        title: "Thành công",
        description: "Đã xóa món thành công",
      });
    } catch (err) {
      console.error('Error deleting menu item:', err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa món. Vui lòng thử lại sau.",
      });
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-700">Danh sách người dùng</h2>
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                      <Input
                        type="search"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                      className="px-3 py-2 border rounded-md border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C] text-gray-700"
                    >
                      <option value="all">Tất cả vai trò</option>
                      <option value="admin">Quản trị viên</option>
                      <option value="STAFF">Nhân viên</option>
                      <option value="customer">Khách hàng</option>
                    </select>
                  </div>
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
                          <TableHead className="text-[#3E503C] w-16">STT</TableHead>
                          <TableHead className="text-[#3E503C]">Tên</TableHead>
                          <TableHead className="text-[#3E503C]">Email</TableHead>
                          <TableHead className="text-[#3E503C]">Vai trò</TableHead>
                          <TableHead className="text-[#3E503C]">Trạng thái</TableHead>
                          <TableHead className="text-[#3E503C] text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentUsers.map((user, index) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="text-gray-700 font-medium">{indexOfFirstUser + index + 1}</TableCell>
                            <TableCell className="text-gray-700 font-medium">{user.fullName}</TableCell>
                            <TableCell className="text-gray-700">{user.email}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'STAFF'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {getRoleDisplay(user.role)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                Đang hoạt động
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-[#3E503C] hover:bg-[#7F886A] text-white border-[#3E503C]"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setCurrentRole(user.role);
                                    setIsChangeRoleDialogOpen(true);
                                  }}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Đổi vai trò
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-[#3E503C] hover:bg-[#7F886A] text-white border-[#3E503C]"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsChangePasswordDialogOpen(true);
                                  }}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                  </svg>
                                  Đổi mật khẩu
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                  onClick={() => handleDeleteUser(user)}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Xóa
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                        <div className="flex justify-between flex-1 sm:hidden">
                          <Button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                          >
                            Trước
                          </Button>
                          <Button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                          >
                            Sau
                          </Button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Hiển thị <span className="font-medium">{indexOfFirstUser + 1}</span> đến{' '}
                              <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> trong{' '}
                              <span className="font-medium">{filteredUsers.length}</span> kết quả
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <Button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                variant="outline"
                                size="sm"
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                              >
                                <span className="sr-only">Trước</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </Button>
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  variant="outline"
                                  size="sm"
                                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-[#3E503C] border-[#3E503C] text-white'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </Button>
                              ))}
                              <Button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                variant="outline"
                                size="sm"
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                              >
                                <span className="sr-only">Sau</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </Button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
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
                          disabled={isChangePasswordLoading}
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
                          disabled={isChangePasswordLoading}
                        />
                      </div>
                      {passwordError && (
                        <div className="text-red-500 text-sm">{passwordError}</div>
                      )}
                      <Button 
                        onClick={handleChangePassword}
                        className="bg-[#3E503C] hover:bg-[#7F886A] text-white"
                        disabled={isChangePasswordLoading}
                      >
                        {isChangePasswordLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Đang cập nhật...
                          </>
                        ) : (
                          'Cập nhật'
                        )}
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
                            placeholder="Nhập tên món"
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
                            placeholder="Nhập giá"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category" className="text-[#3E503C]">Danh mục</Label>
                          <Input
                            id="category"
                            value={newItem.category}
                            onChange={handleInputChange}
                            className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                            placeholder="Nhập danh mục"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description" className="text-[#3E503C]">Mô tả</Label>
                          <Input
                            id="description"
                            value={newItem.description}
                            onChange={handleInputChange}
                            className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                            placeholder="Nhập mô tả"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="imageUrl" className="text-[#3E503C]">URL hình ảnh</Label>
                          <Input
                            id="imageUrl"
                            value={newItem.imageUrl}
                            onChange={handleInputChange}
                            className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C]"
                            placeholder="Nhập URL hình ảnh"
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
                {isMenuLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E503C]"></div>
                  </div>
                ) : menuError ? (
                  <div className="text-red-500 text-center py-4">{menuError}</div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-[#3E503C] w-16">STT</TableHead>
                          <TableHead className="text-[#3E503C]">Tên món</TableHead>
                          <TableHead className="text-[#3E503C]">Giá</TableHead>
                          <TableHead className="text-[#3E503C]">Danh mục</TableHead>
                          <TableHead className="text-[#3E503C]">Trạng thái</TableHead>
                          <TableHead className="text-[#3E503C]">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menuItems.map((item, index) => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell className="text-gray-700 font-medium">{index + 1}</TableCell>
                            <TableCell className="text-gray-600">
                              <div className="flex items-center space-x-3">
                                {item.imageUrl && (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded-md"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                    }}
                                  />
                                )}
                                <span>{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">{item.price.toLocaleString('vi-VN')}đ</TableCell>
                            <TableCell className="text-gray-600">{item.category}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-orange-50 text-orange-700'
                              }`}>
                                <span className="text-gray-700">
                                  {item.status === 'active' ? 'Đang phục vụ' : 'Ngừng phục vụ'}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-[#3E503C] hover:bg-[#7F886A] text-white border-[#3E503C]"
                                  onClick={() => {
                                    setSelectedMenuItem(item);
                                    setEditItem({
                                      name: item.name,
                                      price: item.price,
                                      category: item.category,
                                      description: item.description || '',
                                      status: item.status || 'active',
                                      imageUrl: item.imageUrl || ''
                                    });
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Sửa
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                  onClick={() => handleDeleteMenuItem(item)}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Xóa
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
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
            <AlertDialogCancel className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xóa...
                </>
              ) : (
                'Xác nhận xóa'
              )}
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
                onChange={(e) => setCurrentRole(e.target.value as 'admin' | 'STAFF' | 'customer')}
                className="w-full px-3 py-2 border rounded-md border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C] text-gray-700"
                disabled={isChangeRoleLoading}
              >
                <option value="admin">Quản trị viên</option>
                <option value="STAFF">Nhân viên</option>
                <option value="customer">Khách hàng</option>
              </select>
            </div>
            <Button 
              onClick={handleChangeRole}
              className="bg-[#3E503C] hover:bg-[#7F886A] text-white"
              disabled={isChangeRoleLoading}
            >
              {isChangeRoleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-[#3E503C]/20">
          <DialogHeader>
            <DialogTitle className="text-[#3E503C]">Sửa món</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-gray-700">Tên món</Label>
              <Input
                id="edit-name"
                value={editItem.name}
                onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C] text-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price" className="text-gray-700">Giá</Label>
              <Input
                id="edit-price"
                type="number"
                value={editItem.price}
                onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C] text-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category" className="text-gray-700">Danh mục</Label>
              <Input
                id="edit-category"
                value={editItem.category}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C] text-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-gray-700">Mô tả</Label>
              <Input
                id="edit-description"
                value={editItem.description}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C] text-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status" className="text-gray-700">Trạng thái</Label>
              <Select
                value={editItem.status}
                onValueChange={(value) => setEditItem({ ...editItem, status: value as 'active' | 'inactive' })}
              >
                <SelectTrigger className="border-[#3E503C]/20 text-gray-700 bg-white">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="active">
                    <span className="px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700">
                      Đang phục vụ
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-50 text-orange-700">
                      Ngừng phục vụ
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-imageUrl" className="text-gray-700">URL hình ảnh</Label>
              <Input
                id="edit-imageUrl"
                value={editItem.imageUrl}
                onChange={(e) => setEditItem({ ...editItem, imageUrl: e.target.value })}
                className="border-[#3E503C]/20 focus:border-[#3E503C] focus:ring-[#3E503C] text-gray-700"
              />
            </div>
            {editItem.imageUrl && (
              <div className="mt-2">
                <img
                  src={editItem.imageUrl}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
              </div>
            )}
            <Button 
              onClick={handleEditMenuItem}
              className="bg-[#3E503C] hover:bg-[#7F886A] text-white"
            >
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 