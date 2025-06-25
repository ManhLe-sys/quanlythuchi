"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
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
  phoneNumber?: string;
  address?: string;
}

interface NewUser {
  name: string;
  email: string;
  role: 'admin' | 'STAFF' | 'customer';
  phoneNumber: string;
  address: string;
}

export default function AccountManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'STAFF' | 'customer'>('all');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<'admin' | 'STAFF' | 'customer'>('customer');
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    role: 'customer',
    phoneNumber: '',
    address: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      const userRole = userObj?.role || '';

      const response = await fetch('/api/users/getUsers', {
        headers: {
          'x-user-role': userRole,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    // Apply role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }
    
    // Apply search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      );
    }
    
    return true;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const addUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsActionLoading(true);
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      const userRole = userObj?.role || '';
      
      const response = await fetch('/api/users/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole
        },
        body: JSON.stringify({
          fullName: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phoneNumber: newUser.phoneNumber,
          address: newUser.address
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tạo người dùng');
      }

      toast({
        title: "Thành công",
        description: "Đã tạo người dùng mới",
        variant: "default"
      });

      // Reset form and close dialog
      setNewUser({
        name: '',
        email: '',
        role: 'customer',
        phoneNumber: '',
        address: ''
      });
      setIsAddDialogOpen(false);
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : 'Không thể tạo người dùng',
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const changeRole = async () => {
    if (!selectedUser) return;
    
    try {
      setIsActionLoading(true);
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      const userRole = userObj?.role || '';
      
      const response = await fetch('/api/users/updateRole', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole
        },
        body: JSON.stringify({
          email: selectedUser.email,
          role: currentRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể cập nhật vai trò');
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò người dùng",
        variant: "default"
      });

      // Close dialog and refresh users
      setIsChangeRoleDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : 'Không thể cập nhật vai trò',
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!selectedUser) return;
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu không khớp');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    try {
      setIsActionLoading(true);
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      const userRole = userObj?.role || '';
      
      const response = await fetch('/api/users/resetPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole
        },
        body: JSON.stringify({
          email: selectedUser.email,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể đặt lại mật khẩu');
      }

      toast({
        title: "Thành công",
        description: "Đã đặt lại mật khẩu cho người dùng",
        variant: "default"
      });

      // Reset form and close dialog
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setIsChangePasswordDialogOpen(false);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu',
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'STAFF': return 'Nhân viên';
      case 'customer': return 'Khách hàng';
      default: return role;
    }
  };

  const handleOpenChangeRole = (user: User) => {
    setSelectedUser(user);
    setCurrentRole(user.role);
    setIsChangeRoleDialogOpen(true);
  };

  const handleOpenResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setIsChangePasswordDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-slate-900 text-slate-200">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 mb-8 shadow-lg border border-slate-700/50">
        <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Quản Lý Tài Khoản</h1>
          <p className="text-slate-400">Quản lý thông tin và phân quyền người dùng</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-slate-800/50 backdrop-blur-xl shadow-lg rounded-3xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
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
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-slate-200">
                  <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">Tất cả</SelectItem>
                  <SelectItem value="admin" className="text-slate-200 hover:bg-slate-700">Admin</SelectItem>
                  <SelectItem value="STAFF" className="text-slate-200 hover:bg-slate-700">Nhân viên</SelectItem>
                  <SelectItem value="customer" className="text-slate-200 hover:bg-slate-700">Khách hàng</SelectItem>
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
              Thêm người dùng
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Họ tên</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Vai trò</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4 text-rose-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p>Đã xảy ra lỗi: {error}</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <p>Không tìm thấy người dùng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{user.fullName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === 'admin'
                          ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                          : user.role === 'STAFF'
                            ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
                            : 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'STAFF' ? 'Nhân viên' : 'Khách hàng'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => handleOpenChangeRole(user)}
                          className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors"
                        >
                          Đổi vai trò
                        </Button>
                        <Button
                          onClick={() => handleOpenResetPassword(user)}
                          className="px-3 py-1 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          Đổi mật khẩu
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
            Trang {currentPage} / {Math.ceil(filteredUsers.length / 10)}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / 10)))}
              disabled={currentPage === Math.ceil(filteredUsers.length / 10)}
              className="px-3 py-1 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">Thêm người dùng mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Họ tên</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập họ tên"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-300">Vai trò</Label>
              <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="w-full rounded-xl bg-slate-900/50 text-slate-200 border-slate-600 hover:bg-slate-800/50">
                  <SelectValue placeholder="Chọn vai trò" />
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
              onClick={() => setIsAddDialogOpen(false)}
              className="rounded-xl bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
            >
              Hủy
            </Button>
            <Button
              onClick={addUser}
              disabled={isActionLoading}
              className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg"
            >
              {isActionLoading ? 'Đang xử lý...' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">Đổi vai trò người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Chọn vai trò mới</Label>
              <Select value={currentRole} onValueChange={(value: any) => setCurrentRole(value)}>
                <SelectTrigger className="w-full rounded-xl bg-slate-900/50 text-slate-200 border-slate-600 hover:bg-slate-800/50">
                  <SelectValue placeholder="Chọn vai trò" />
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
              Hủy
            </Button>
            <Button
              onClick={changeRole}
              disabled={isActionLoading}
              className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg"
            >
              {isActionLoading ? 'Đang xử lý...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border-slate-700/50 shadow-xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">Đổi mật khẩu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-300">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập lại mật khẩu mới"
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
              Hủy
            </Button>
            <Button
              onClick={resetPassword}
              disabled={isActionLoading}
              className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg"
            >
              {isActionLoading ? 'Đang xử lý...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 