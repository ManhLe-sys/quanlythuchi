'use client';

import { useState } from 'react';
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

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  status: 'active' | 'inactive';
  imageUrl: string;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: '',
    description: '',
    status: 'active',
    imageUrl: '',
  });

  const handleAddItem = () => {
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

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Menu</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Thêm món mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm món mới</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên món</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Giá</Label>
                <Input
                  id="price"
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Danh mục</Label>
                <Input
                  id="category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">URL hình ảnh</Label>
                <Input
                  id="imageUrl"
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                />
              </div>
              <Button onClick={handleAddItem}>Thêm món</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên món</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {menuItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.price.toLocaleString('vi-VN')}đ</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.status === 'active' ? 'Đang phục vụ' : 'Ngừng phục vụ'}
                </span>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" className="mr-2">
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
  );
} 