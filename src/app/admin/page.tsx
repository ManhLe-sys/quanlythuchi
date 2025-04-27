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
import Link from 'next/link';
import { useLanguage } from "../contexts/LanguageContext";

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
  quantity?: number;
}

interface NewUser {
  name: string;
  email: string;
  role: 'admin' | 'STAFF' | 'customer';
}

export default function AdminPage() {
  const { toast } = useToast();
  const { translate } = useLanguage();
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
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    role: 'customer'
  });
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: '',
    description: '',
    status: 'active',
    imageUrl: '',
    quantity: 0
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
    imageUrl: '',
    quantity: 0
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
        quantity: 0
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
    const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter.toLowerCase();
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

  const openEditDialog = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setEditItem({
      name: item.name || '',
      price: item.price || 0,
      category: item.category || '',
      description: item.description || '',
      status: item.status || 'active',
      imageUrl: item.imageUrl || '',
      quantity: item.quantity || 0
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteMenuItem = async (item: MenuItem) => {
    if (!confirm('Bạn có chắc chắn muốn ngừng bán món này không?')) {
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
        throw new Error('Failed to deactivate menu item');
      }

      const data = await response.json();
      setMenuItems(menuItems.map(i => 
        i.id === data.deletedId 
          ? { ...i, status: 'inactive' } 
          : i
      ));
      toast({
        title: "Thành công",
        description: "Đã ngừng bán món thành công",
      });
    } catch (err) {
      console.error('Error deactivating menu item:', err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể ngừng bán món. Vui lòng thử lại sau.",
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    try {
      setIsActionLoading(true);
      const response = await fetch('/api/users/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('Failed to add user');
      }

      await fetchUsers();
      setIsAddDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        role: 'customer'
      });
      
      toast({
        title: "Thành công",
        description: "Đã thêm người dùng thành công",
      });
    } catch (err) {
      console.error('Error adding user:', err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm người dùng. Vui lòng thử lại sau.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{translate('quan_ly_he_thong')}</h1>
            <p className="text-white/80">
              {translate('quan_ly_nguoi_dung')} & {translate('quan_ly_thuc_don')}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setActiveTab('users')}
              variant={activeTab === 'users' ? 'default' : 'outline'}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {translate('quan_ly_nguoi_dung')}
            </Button>
            <Button
              onClick={() => setActiveTab('menu')}
              variant={activeTab === 'menu' ? 'default' : 'outline'}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'menu'
                ? 'bg-white text-blue-600 shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {translate('quan_ly_thuc_don')}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Access Buttons */}
      {/* 
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/account">
          <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quản Lý Tài Khoản</h2>
                <p className="text-gray-600">Thêm, sửa và quản lý tài khoản người dùng</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/menu">
          <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4.5M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293A1 1 0 005.414 17H15a1 1 0 100-2H7a1 1 0 11-2 0zm15.5-3.5l-7 7m0 0l-3.5-3.5m3.5 3.5l-7-7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quản Lý Sản Phẩm</h2>
                <p className="text-gray-600">Thêm, sửa và quản lý các món trong thực đơn</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      */}

      {/* Users Management Section */}
      {activeTab === 'users' && (
        <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder={translate('tim_kiem_nguoi_dung')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={(value: 'all' | 'admin' | 'STAFF' | 'customer') => setRoleFilter(value)}>
                  <SelectTrigger className="w-[180px] rounded-xl bg-white text-gray-700 hover:bg-gray-50 border-gray-200">
                    <SelectValue placeholder={translate('loc_theo_vai_tro')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-md">
                    <SelectItem value="all" className="text-gray-700 hover:bg-gray-50">{translate('tat_ca')}</SelectItem>
                    <SelectItem value="admin" className="text-gray-700 hover:bg-gray-50">{translate('admin_role')}</SelectItem>
                    <SelectItem value="STAFF" className="text-gray-700 hover:bg-gray-50">{translate('nhan_vien')}</SelectItem>
                    <SelectItem value="customer" className="text-gray-700 hover:bg-gray-50">{translate('khach_hang_role')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#3E503C] hover:bg-[#7F886A] text-white rounded-xl transition-all shadow-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {translate('them_nguoi_dung')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl text-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{translate('them_nguoi_dung')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        {translate('ten_day_du')}
                      </Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="rounded-xl"
                        placeholder="Nhập họ tên"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        {translate('email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="rounded-xl"
                        placeholder="Nhập email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        {translate('vai_tro_user')}
                      </Label>
                      <Select value={newUser.role} onValueChange={(value: 'admin' | 'STAFF' | 'customer') => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger className="w-full rounded-xl bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                          <SelectValue placeholder="Chọn vai trò" className="text-gray-700" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-md">
                          <SelectItem value="admin" className="text-gray-700 hover:bg-gray-50">Admin</SelectItem>
                          <SelectItem value="STAFF" className="text-gray-700 hover:bg-gray-50">Nhân viên</SelectItem>
                          <SelectItem value="customer" className="text-gray-700 hover:bg-gray-50">Khách hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="rounded-xl hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                    >
                      {translate('huy_bo')}
                    </Button>
                    <Button
                      onClick={handleAddUser}
                      disabled={isActionLoading}
                      className="rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all shadow-lg"
                    >
                      {isActionLoading ? 'Đang xử lý...' : 'Thêm'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="w-[250px]">{translate('ten_day_du')}</TableHead>
                  <TableHead>{translate('email')}</TableHead>
                  <TableHead>{translate('vai_tro_user')}</TableHead>
                  <TableHead className="text-right">{translate('thao_tac')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-[#3E503C] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-600">{translate('dang_tai_du_lieu')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4 text-red-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>{translate('da_xay_ra_loi')}: {error}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4 text-gray-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <p>{translate('khong_tim_thay_sp')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((user) => (
                    <TableRow key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="font-medium text-gray-700">{user.fullName}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-gray-700">{user.email}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                user.role === 'admin' 
                            ? 'bg-[#3E503C]/10 text-[#3E503C] ring-1 ring-[#3E503C]/20'
                                  : user.role === 'STAFF'
                              ? 'bg-[#7F886A]/10 text-[#7F886A] ring-1 ring-[#7F886A]/20'
                              : 'bg-gray-50 text-gray-700 ring-1 ring-gray-700/10'
                              }`}>
                                {getRoleDisplay(user.role)}
                              </span>
                            </TableCell>
                      <TableCell className="py-4 px-6">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setCurrentRole(user.role);
                                    setIsChangeRoleDialogOpen(true);
                                  }}
                            variant="outline"
                            className="rounded-xl bg-white hover:bg-[#3E503C]/10 text-gray-700 border border-[#3E503C]/20 hover:border-[#3E503C]/30 px-4 py-2 transition-all flex items-center gap-2"
                                >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Đổi vai trò
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsChangePasswordDialogOpen(true);
                                  }}
                            variant="outline"
                            className="rounded-xl bg-white hover:bg-[#3E503C]/10 text-gray-700 border border-[#3E503C]/20 hover:border-[#3E503C]/30 px-4 py-2 transition-all flex items-center gap-2"
                                >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                  </svg>
                                  Đổi mật khẩu
                                </Button>
                                <Button 
                            onClick={() => {
                              setUserToDelete(user);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="rounded-xl bg-white hover:bg-[#FF6F3D]/10 text-gray-700 border border-[#FF6F3D]/20 hover:border-[#FF6F3D]/30 px-4 py-2 transition-all flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Xóa
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              {translate('trang')} {currentPage} / {Math.ceil(filteredUsers.length / itemsPerPage)}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 disabled:opacity-50"
              >
                {translate('trang_truoc')}
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
                className="px-3 py-1 text-sm rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 disabled:opacity-50"
              >
                {translate('trang_sau')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Management Section */}
      {activeTab === 'menu' && (
        <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder={translate('tim_kiem_mon_an')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#3E503C] hover:bg-[#7F886A] text-white rounded-xl transition-all shadow-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {translate('them_mon_an')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl text-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{translate('them_mon_an')}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        {translate('ten_mon')}
                      </Label>
                      <Input
                        id="name"
                        value={newItem.name}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        placeholder="Nhập tên món"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        {translate('gia')}
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={newItem.price}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        placeholder="Nhập giá"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        {translate('danh_muc')}
                      </Label>
                      <Input
                        id="category"
                        value={newItem.category}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        placeholder="Nhập danh mục"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        {translate('mo_ta')}
                      </Label>
                      <Input
                        id="description"
                        value={newItem.description}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        placeholder="Nhập mô tả"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                        {translate('hinh_anh')}
                      </Label>
                      <Input
                        id="imageUrl"
                        value={newItem.imageUrl}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        placeholder="Nhập URL hình ảnh"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="quantity" className="text-gray-700 font-medium">Số lượng</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        placeholder="Nhập số lượng"
                      />
                    </div>
                    <Button 
                      onClick={handleAddMenuItem}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm món
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="w-[250px]">{translate('ten_mon')}</TableHead>
                  <TableHead>{translate('gia')}</TableHead>
                  <TableHead>{translate('danh_muc')}</TableHead>
                  <TableHead>{translate('trang_thai')}</TableHead>
                  <TableHead className="text-right">{translate('thao_tac')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMenuLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-[#3E503C] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                              </div>
                            </TableCell>
                  </TableRow>
                ) : menuError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4 text-red-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{menuError}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : menuItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4 text-gray-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p>Chưa có món ăn nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMenuItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="font-medium text-gray-700">{item.name}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-gray-700">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(item.price)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-gray-700">{item.category}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-gray-700">{item.quantity || 0}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                item.status === 'active' 
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                            : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/10'
                              }`}>
                          {item.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                              </span>
                            </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                                <Button 
                                  onClick={() => openEditDialog(item)}
                                  variant="outline"
                                  className="rounded-xl bg-white hover:bg-[#3E503C]/10 text-gray-700 border border-[#3E503C]/20 hover:border-[#3E503C]/30 px-4 py-2 transition-all flex items-center gap-2"
                                >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Sửa
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteMenuItem(item)}
                            className="rounded-xl bg-white hover:bg-[#FF6F3D]/10 text-gray-700 border border-[#FF6F3D]/20 hover:border-[#FF6F3D]/30 px-4 py-2 transition-all flex items-center gap-2"
                                >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Ngừng bán
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              {translate('trang')} {currentPage} / {Math.ceil(filteredMenuItems.length / itemsPerPage)}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 disabled:opacity-50"
              >
                {translate('trang_truoc')}
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredMenuItems.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredMenuItems.length / itemsPerPage)}
                className="px-3 py-1 text-sm rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 disabled:opacity-50"
              >
                {translate('trang_sau')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl text-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{translate('doi_mat_khau')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-right text-gray-700">
                {translate('mat_khau_moi')}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-right text-gray-700">
                {translate('xac_nhan_mat_khau')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangePasswordDialogOpen(false)}
              className="rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
            >
              {translate('huy_bo')}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangePasswordLoading}
              className="rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all shadow-lg"
            >
              {isChangePasswordLoading ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl text-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{translate('doi_vai_tro')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Chọn vai trò mới</Label>
              <Select value={currentRole} onValueChange={(value: any) => setCurrentRole(value)}>
                <SelectTrigger className="w-full rounded-xl bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                  <SelectValue placeholder="Chọn vai trò" className="text-gray-700" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-md">
                  <SelectItem value="admin" className="text-gray-700 hover:bg-gray-50">Admin</SelectItem>
                  <SelectItem value="STAFF" className="text-gray-700 hover:bg-gray-50">Nhân viên</SelectItem>
                  <SelectItem value="customer" className="text-gray-700 hover:bg-gray-50">Khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsChangeRoleDialogOpen(false)}
              className="rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
            >
              {translate('huy_bo')}
            </Button>
            <Button 
              onClick={handleChangeRole}
              disabled={isChangeRoleLoading}
              className="rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white transition-all shadow-lg"
            >
              {isChangeRoleLoading ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl text-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">{translate('xac_nhan_xoa')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              {translate('ban_co_chac_xoa')} {translate('hanh_dong_khong_hoan_tac')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl bg-white border border-[#3E503C]/20 hover:border-[#3E503C]/30 text-gray-700">
              {translate('huy_bo')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleteLoading}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleteLoading ? 'Đang xử lý...' : translate('xoa')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl text-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{translate('chinh_sua')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName" className="text-gray-700 font-medium">Tên món</Label>
              <Input
                id="editName"
                value={editItem.name}
                onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                className="rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                placeholder="Nhập tên món"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editPrice" className="text-gray-700 font-medium">Giá</Label>
              <Input
                id="editPrice"
                type="number"
                value={editItem.price}
                onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                className="rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                placeholder="Nhập giá"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editCategory" className="text-gray-700 font-medium">Danh mục</Label>
              <Input
                id="editCategory"
                value={editItem.category}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                className="rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                placeholder="Nhập danh mục"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDescription" className="text-gray-700 font-medium">Mô tả</Label>
              <Input
                id="editDescription"
                value={editItem.description}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                className="rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                placeholder="Nhập mô tả"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editImageUrl" className="text-gray-700 font-medium">URL hình ảnh</Label>
              <Input
                id="editImageUrl"
                value={editItem.imageUrl}
                onChange={(e) => setEditItem({ ...editItem, imageUrl: e.target.value })}
                className="rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                placeholder="Nhập URL hình ảnh"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editQuantity" className="text-gray-700 font-medium">Số lượng</Label>
              <Input
                id="editQuantity"
                type="number"
                value={editItem.quantity}
                onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value) })}
                className="rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                placeholder="Nhập số lượng"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editStatus" className="text-gray-700 font-medium">Trạng thái</Label>
              <Select value={editItem.status} onValueChange={(value: 'active' | 'inactive') => setEditItem({ ...editItem, status: value })}>
                <SelectTrigger className="w-full rounded-xl bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                  <SelectValue placeholder="Chọn trạng thái" className="text-gray-700" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-md">
                  <SelectItem value="active" className="text-gray-700 hover:bg-gray-50">Đang bán</SelectItem>
                  <SelectItem value="inactive" className="text-gray-700 hover:bg-gray-50">Ngừng bán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
            >
              {translate('huy_bo')}
            </Button>
            <Button 
              onClick={handleEditMenuItem}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-lg"
            >
              {translate('luu')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 