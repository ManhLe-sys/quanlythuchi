"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  imageUrl: string;
}

interface FormData {
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  image: File | null;
}

export default function EditMenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: "",
    price: 0,
    quantity: 0,
    description: "",
    image: null
  });

  const categories = [
    "Món chính",
    "Món phụ",
    "Tráng miệng",
    "Đồ uống",
    "Khác"
  ];

  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/menu/${params.id}`);
        if (!response.ok) {
          throw new Error("Không thể tải thông tin món ăn");
        }
        const data: MenuItem = await response.json();
        setFormData({
          name: data.name,
          category: data.category,
          price: data.price,
          quantity: data.quantity,
          description: data.description,
          image: null
        });
        setImagePreview(data.imageUrl);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin món ăn",
          variant: "destructive",
        });
        router.push("/admin/menu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItem();
  }, [params.id, router, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("quantity", formData.quantity.toString());
      formDataToSend.append("description", formData.description);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const response = await fetch(`/api/menu/${params.id}`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật món ăn");
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật món ăn",
        variant: "default",
      });

      router.push("/admin/menu");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật món ăn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen bg-slate-900 text-slate-200">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-slate-900 text-slate-200">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 mb-8 shadow-lg border border-slate-700/50">
        <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Chỉnh Sửa Món Ăn</h1>
          <p className="text-slate-400">Cập nhật thông tin món ăn</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-slate-800/50 backdrop-blur-xl shadow-lg rounded-3xl border border-slate-700/50 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Tên món</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập tên món"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-slate-300">Danh mục</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="mt-1 w-full rounded-xl bg-slate-900/50 text-slate-200 border-slate-600 hover:bg-slate-800/50">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-slate-200">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-slate-200 hover:bg-slate-700">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price" className="text-slate-300">Giá</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="mt-1 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập giá"
                min={0}
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity" className="text-slate-300">Số lượng</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="mt-1 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập số lượng"
                min={0}
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-300">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border-slate-600 text-slate-200"
                placeholder="Nhập mô tả món ăn"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="image" className="text-slate-300">Hình ảnh</Label>
              <div className="mt-1">
                <div className="flex items-center justify-center w-full">
                  <label className="w-full h-32 flex flex-col items-center justify-center px-4 py-6 bg-slate-900/50 text-slate-400 rounded-xl border-2 border-slate-600 border-dashed hover:bg-slate-800/50 hover:border-slate-500 transition-all cursor-pointer">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="mt-2 text-sm">Chọn hình ảnh mới</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                {imagePreview && (
                  <div className="mt-4 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, image: null });
                      }}
                      className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Link href="/admin/menu">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
              >
                Hủy
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
