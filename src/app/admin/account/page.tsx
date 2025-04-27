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
      const response = await fetch('/api/users/getUsers');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
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
      const response = await fetch('/api/users/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch('/api/users/updateRole', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    try {
      setIsActionLoading(true);
      const response = await fetch('/api/users/resetPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedUser.email,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể đặt lại mật khẩu');
      }

      toast({
        title: "Thành công",
        description: "Đã đặt lại mật khẩu",
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
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Quản Lý Tài Khoản</h1>
            <p className="text-white/80">
              Quản lý danh sách tài khoản người dùng trong hệ thống
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="px-6 py-3 bg-white text-[#3E503C] rounded-xl hover:bg-[#3E503C]/10 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm Người Dùng
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder="Tìm kiếm tên hoặc email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full rounded-xl"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full md:w-48">
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="STAFF">Nhân viên</SelectItem>
                <SelectItem value="customer">Khách hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl border border-gray-100 overflow-hidden">
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
            <Button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-[#3E503C] text-white rounded-xl hover:bg-[#7F886A] transition-colors text-gray-700"
            >
              Thử lại
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700">Không tìm thấy người dùng nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tên</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Vai trò</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Số điện thoại</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Địa chỉ</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{user.email}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.role === 'admin' 
                            ? 'bg-[#3E503C]/10 text-[#3E503C] ring-1 ring-[#3E503C]/20'
                            : user.role === 'STAFF'
                              ? 'bg-[#7F886A]/10 text-[#7F886A] ring-1 ring-[#7F886A]/20'
                              : 'bg-gray-50 text-gray-700 ring-1 ring-gray-700/10'
                        }`}>
                          {getRoleDisplay(user.role)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{user.phoneNumber || '—'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{user.address || '—'}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenChangeRole(user)}
                            className="text-yellow-500 hover:text-yellow-700 bg-yellow-50 p-2 rounded-full text-gray-700"
                            title="Đổi vai trò"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenResetPassword(user)}
                            className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-full text-gray-700"
                            title="Đặt lại mật khẩu"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} trong {filteredUsers.length} kết quả
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg px-4 py-2 text-gray-700"
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg px-4 py-2 text-gray-700"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Thêm Người Dùng Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Họ và tên</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nhập họ và tên"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Nhập địa chỉ email"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Vai trò</Label>
              <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="w-full rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-md">
                  <SelectItem value="admin" className="text-gray-700">Quản trị viên</SelectItem>
                  <SelectItem value="STAFF" className="text-gray-700">Nhân viên</SelectItem>
                  <SelectItem value="customer" className="text-gray-700">Khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Số điện thoại</Label>
              <Input
                type="tel"
                value={newUser.phoneNumber}
                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                placeholder="Nhập số điện thoại"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Địa chỉ</Label>
              <Input
                value={newUser.address}
                onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                placeholder="Nhập địa chỉ"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
            >
              Hủy
            </Button>
            <Button 
              onClick={addUser}
              disabled={isActionLoading}
              className="rounded-xl bg-[#3E503C] hover:bg-[#7F886A] text-white transition-all shadow-lg text-gray-700"
            >
              {isActionLoading ? 'Đang xử lý...' : 'Thêm người dùng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Đổi Vai Trò</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Người dùng</Label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl">
                <div className="font-medium text-gray-800">{selectedUser?.fullName}</div>
                <div className="text-sm text-gray-500">{selectedUser?.email}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Chọn vai trò mới</Label>
              <Select value={currentRole} onValueChange={(value: any) => setCurrentRole(value)}>
                <SelectTrigger className="w-full rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-700">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-md">
                  <SelectItem value="admin" className="text-gray-700">Quản trị viên</SelectItem>
                  <SelectItem value="STAFF" className="text-gray-700">Nhân viên</SelectItem>
                  <SelectItem value="customer" className="text-gray-700">Khách hàng</SelectItem>
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
              Hủy
            </Button>
            <Button 
              onClick={changeRole}
              disabled={isActionLoading}
              className="rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white transition-all shadow-lg text-gray-700"
            >
              {isActionLoading ? 'Đang xử lý...' : 'Cập nhật vai trò'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Đặt Lại Mật Khẩu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Người dùng</Label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl">
                <div className="font-medium text-gray-800">{selectedUser?.fullName}</div>
                <div className="text-sm text-gray-500">{selectedUser?.email}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Mật khẩu mới</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Xác nhận mật khẩu mới</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="rounded-xl"
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsChangePasswordDialogOpen(false)}
              className="rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
            >
              Hủy
            </Button>
            <Button 
              onClick={resetPassword}
              disabled={isActionLoading}
              className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-lg text-gray-700"
            >
              {isActionLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 