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
    <div className="container mx-auto px-4 py-8 min-h-screen bg-slate-900 text-slate-200">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 mb-8 shadow-lg border border-slate-700/50">
        <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">{translate('quan_ly_he_thong')}</h1>
            <p className="text-slate-400">
              {translate('quan_ly_nguoi_dung')} & {translate('quan_ly_thuc_don')}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setActiveTab('users')}
              variant={activeTab === 'users' ? 'default' : 'outline'}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'users'
                ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border-slate-600'
              }`}
            >
              {translate('quan_ly_nguoi_dung')}
            </Button>
            <Button
              onClick={() => setActiveTab('menu')}
              variant={activeTab === 'menu' ? 'default' : 'outline'}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'menu'
                ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border-slate-600'
              }`}
            >
              {translate('quan_ly_thuc_don')}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/account">
          <div className="group bg-slate-800/50 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 h-full">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Quản Lý Tài Khoản</h2>
                <p className="text-slate-400">Thêm, sửa và quản lý tài khoản người dùng</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/menu">
          <div className="group bg-slate-800/50 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 h-full">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4.5M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293A1 1 0 005.414 17H15a1 1 0 100-2H7a1 1 0 11-2 0zm15.5-3.5l-7 7m0 0l-3.5-3.5m3.5 3.5l-7-7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Quản Lý Sản Phẩm</h2>
                <p className="text-slate-400">Thêm, sửa và quản lý các món trong thực đơn</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Users Management Section */}
      {activeTab === 'users' && (
        <div className="bg-slate-800/50 backdrop-blur-xl shadow-lg rounded-3xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder={translate('tim_kiem_nguoi_dung')}
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
                
                <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                  <SelectTrigger className="w-[180px] rounded-xl bg-slate-900/50 text-slate-200 border-slate-600 hover:bg-slate-800/50">
                    <SelectValue placeholder={translate('loc_theo_vai_tro')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-slate-200">
                    <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">{translate('tat_ca')}</SelectItem>
                    <SelectItem value="admin" className="text-slate-200 hover:bg-slate-700">{translate('admin_role')}</SelectItem>
                    <SelectItem value="STAFF" className="text-slate-200 hover:bg-slate-700">{translate('nhan_vien')}</SelectItem>
                    <SelectItem value="customer" className="text-slate-200 hover:bg-slate-700">{translate('khach_hang_role')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {translate('them_nguoi_dung')}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-700/50 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">{translate('ten_day_du')}</TableHead>
                  <TableHead className="text-slate-300">{translate('email')}</TableHead>
                  <TableHead className="text-slate-300">{translate('vai_tro_user')}</TableHead>
                  <TableHead className="text-right text-slate-300">{translate('thao_tac')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400">{translate('dang_tai_du_lieu')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4 text-rose-400">
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
                      <div className="flex flex-col items-center gap-4 text-slate-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <p>{translate('khong_tim_thay_sp')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <TableCell className="py-4 px-6">
                      <div className="font-medium text-slate-200">{user.fullName}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-slate-300">{user.email}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === 'admin' 
                          ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                          : user.role === 'STAFF'
                            ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
                            : 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20'
                      }`}>
                        {getRoleDisplay(user.role)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleChangePassword()}
                          className="px-3 py-1 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          {translate('doi_mat_khau')}
                        </Button>
                        <Button
                          onClick={() => handleChangeRole()}
                          className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors"
                        >
                          {translate('doi_vai_tro')}
                        </Button>
                        <Button
                          onClick={() => handleDeleteUser(user)}
                          className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors"
                        >
                          {translate('xoa')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
            <div className="text-sm text-slate-400">
              {translate('trang')} {currentPage} / {Math.ceil(filteredUsers.length / itemsPerPage)}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
              >
                {translate('trang_truoc')}
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
                className="px-3 py-1 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
              >
                {translate('trang_sau')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Management Section */}
      {activeTab === 'menu' && (
        <div className="bg-slate-800/50 backdrop-blur-xl shadow-lg rounded-3xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder={translate('tim_kiem_mon_an')}
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

              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {translate('them_mon_moi')}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-700/50 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">{translate('ten_mon')}</TableHead>
                  <TableHead className="text-slate-300">{translate('gia')}</TableHead>
                  <TableHead className="text-slate-300">{translate('danh_muc')}</TableHead>
                  <TableHead className="text-slate-300">{translate('trang_thai')}</TableHead>
                  <TableHead className="text-right text-slate-300">{translate('thao_tac')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMenuLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400">Đang tải dữ liệu...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : menuError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4 text-rose-400">
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
                      <div className="flex flex-col items-center gap-4 text-slate-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p>Chưa có món ăn nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMenuItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="font-medium text-slate-200">{item.name}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-slate-300">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(item.price)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-slate-300">{item.category}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-slate-300">{item.quantity || 0}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                item.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20'
                              }`}>
                          {item.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openEditDialog(item)}
                            className="px-3 py-1 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            {translate('chinh_sua')}
                          </Button>
                          <Button
                            onClick={() => handleDeleteMenuItem(item)}
                            className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors"
                          >
                            {translate('xoa')}
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
            <div className="text-sm text-slate-400">
              {translate('trang')} {currentPage} / {Math.ceil(filteredMenuItems.length / itemsPerPage)}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
              >
                {translate('trang_truoc')}
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredMenuItems.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredMenuItems.length / itemsPerPage)}
                className="px-3 py-1 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
              >
                {translate('trang_sau')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">{translate('doi_mat_khau')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-right text-slate-300">
                {translate('mat_khau_moi')}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-right text-slate-300">
                {translate('xac_nhan_mat_khau')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-rose-400">{passwordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangePasswordDialogOpen(false)}
              className="rounded-xl bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
            >
              {translate('huy_bo')}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangePasswordLoading}
              className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg"
            >
              {isChangePasswordLoading ? 'Đang xử lý...' : translate('xac_nhan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">{translate('doi_vai_tro')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300 font-medium">Chọn vai trò mới</Label>
              <Select value={currentRole} onValueChange={(value: any) => setCurrentRole(value)}>
                <SelectTrigger className="w-full rounded-xl bg-slate-900/50 text-slate-200 border-slate-600 hover:bg-slate-800/50">
                  <SelectValue placeholder="Chọn vai trò" className="text-slate-200" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-slate-200">
                  <SelectItem value="admin" className="text-slate-200 hover:bg-slate-700">Admin</SelectItem>
                  <SelectItem value="STAFF" className="text-slate-200 hover:bg-slate-700">Nhân viên</SelectItem>
                  <SelectItem value="customer" className="text-slate-200 hover:bg-slate-700">Khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsChangeRoleDialogOpen(false)}
              className="rounded-xl bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
            >
              {translate('huy_bo')}
            </Button>
            <Button 
              onClick={handleChangeRole}
              disabled={isChangeRoleLoading}
              className="rounded-xl bg-amber-500 text-amber-400 hover:bg-amber-600 transition-all shadow-lg"
            >
              {isChangeRoleLoading ? 'Đang xử lý...' : translate('xac_nhan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-slate-100">{translate('xac_nhan_xoa')}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {translate('ban_co_chac_xoa')} {translate('hanh_dong_khong_hoan_tac')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600">
              {translate('huy_bo')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleteLoading}
              className="rounded-xl bg-rose-500 text-rose-400 hover:bg-rose-600"
            >
              {isDeleteLoading ? 'Đang xử lý...' : translate('xoa')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">{translate('chinh_sua')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName" className="text-slate-300 font-medium">Tên món</Label>
              <Input
                id="editName"
                value={editItem.name}
                onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập tên món"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editPrice" className="text-slate-300 font-medium">Giá</Label>
              <Input
                id="editPrice"
                type="number"
                value={editItem.price}
                onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập giá"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editCategory" className="text-slate-300 font-medium">Danh mục</Label>
              <Input
                id="editCategory"
                value={editItem.category}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập danh mục"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDescription" className="text-slate-300 font-medium">Mô tả</Label>
              <Input
                id="editDescription"
                value={editItem.description}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập mô tả"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editImageUrl" className="text-slate-300 font-medium">URL hình ảnh</Label>
              <Input
                id="editImageUrl"
                value={editItem.imageUrl}
                onChange={(e) => setEditItem({ ...editItem, imageUrl: e.target.value })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập URL hình ảnh"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editQuantity" className="text-slate-300 font-medium">Số lượng</Label>
              <Input
                id="editQuantity"
                type="number"
                value={editItem.quantity}
                onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value) })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập số lượng"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editStatus" className="text-slate-300 font-medium">Trạng thái</Label>
              <Select value={editItem.status} onValueChange={(value: 'active' | 'inactive') => setEditItem({ ...editItem, status: value })}>
                <SelectTrigger className="w-full rounded-xl bg-slate-900/50 text-slate-200 border-slate-600 hover:bg-slate-800/50">
                  <SelectValue placeholder="Chọn trạng thái" className="text-slate-200" />
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
              {translate('huy_bo')}
            </Button>
            <Button 
              onClick={handleEditMenuItem}
              className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg"
            >
              {translate('luu')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 