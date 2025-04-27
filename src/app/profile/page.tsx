"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface UserProfile {
  fullName: string;
  email: string;
  role: string;
  registrationTime?: string;
  phoneNumber?: string;
  address?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { translate } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [initialProfile, setInitialProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    role: ""
  });
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    role: ""
  });

  useEffect(() => {
    if (user) {
      // Trước tiên, sử dụng dữ liệu đã có từ context auth để hiển thị ngay
      const userProfileFromAuth = {
        fullName: user.fullName || "",
        email: user.email || "",
        role: user.role || "customer",
        phoneNumber: user.phoneNumber || "",
        address: user.address || ""
      };
      
      setProfile(userProfileFromAuth);
      setInitialProfile(userProfileFromAuth);
      
      // Sau đó mới gọi API để lấy dữ liệu đầy đủ
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user || !user.email) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/users/profile?email=${encodeURIComponent(user.email)}`, {
        headers: {
          'x-user-email': user.email,
          'x-user-role': user.role || 'user'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const userProfile = {
          fullName: data.data.fullName || user.fullName || "",
          email: user.email,
          role: data.data.role || user.role || "user",
          registrationTime: data.data.registrationTime || "",
          phoneNumber: data.data.phoneNumber || "",
          address: data.data.address || ""
        };
        
        setProfile(userProfile);
        setInitialProfile(userProfile);
      } else {
        // Nếu không tìm thấy profile, sử dụng thông tin từ auth context
        const userProfile = {
          fullName: user.fullName || "",
          email: user.email,
          role: user.role || "user",
          phoneNumber: user.phoneNumber || "",
          address: user.address || ""
        };
        
        setProfile(userProfile);
        setInitialProfile(userProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        variant: "destructive",
        title: translate("loi"),
        description: translate("da_xay_ra_loi")
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const hasChanges = () => {
    return profile.fullName !== initialProfile.fullName ||
           profile.phoneNumber !== initialProfile.phoneNumber ||
           profile.address !== initialProfile.address;
  };

  const handleConfirmUpdate = () => {
    if (!hasChanges()) {
      toast({
        title: translate("thong_bao"),
        description: translate("khong_co_thay_doi")
      });
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    setShowConfirmDialog(false);
    
    if (!user || !user.email) {
      toast({
        variant: "destructive",
        title: translate("loi"),
        description: translate("vui_long_dang_nhap_lai")
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'x-user-email': user.email,
          'x-user-role': user.role || 'user'
        },
        body: JSON.stringify({
          email: user.email,
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          address: profile.address
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: translate("thanh_cong"),
          description: translate("cap_nhat_thanh_cong")
        });
        
        // Cập nhật initialProfile để không còn hiển thị có thay đổi
        setInitialProfile(profile);
      } else {
        console.error("API Error:", data);
        // Xử lý lỗi xác thực
        if (response.status === 401) {
          toast({
            variant: "destructive",
            title: translate("loi_xac_thuc"),
            description: translate("phien_het_han"),
            action: (
              <Button
                onClick={() => window.location.href = "/login"}
                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg mt-2"
              >
                {translate("dang_nhap_lai")}
              </Button>
            )
          });
        } else {
          toast({
            variant: "destructive",
            title: translate("loi"),
            description: data.message || translate("da_xay_ra_loi")
          });
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: translate("loi"),
        description: translate("da_xay_ra_loi")
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-lg flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-700 mt-4">{translate("vui_long_dang_nhap")}</h1>
          <p className="text-gray-500 mt-2">{translate("can_dang_nhap_de_xem_trang")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-700">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3E503C] to-[#7F886A] rounded-3xl p-8 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-white mb-2">{translate("thong_tin_ca_nhan")}</h1>
          <p className="text-white/80">
            {translate("cap_nhat_thong_tin")}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-lg p-8">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-[#3E503C] border-gray-200 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700 font-medium">{translate("dang_tai_thong_tin")}</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center mb-8">
          <div className="h-20 w-20 rounded-full bg-[#3E503C] flex items-center justify-center text-white text-3xl font-medium mr-6">
            {profile.fullName.charAt(0) || user.email.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{profile.fullName}</h2>
            <p className="text-gray-500">{profile.email}</p>
            <p className="text-sm text-gray-500 mt-1">{translate("vai_tro")}: {profile.role || translate("nguoi_dung")}</p>
            {profile.registrationTime && (
              <p className="text-sm text-gray-500 mt-1">{translate("thoi_gian_dang_ky")}: {profile.registrationTime}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-gray-700">{translate("ho_ten")}</Label>
              <Input 
                id="fullName"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="mt-1 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-gray-700">{translate("email")}</Label>
              <Input 
                id="email"
                name="email"
                value={profile.email}
                disabled
                className="mt-1 rounded-xl border-gray-200 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">{translate("email_khong_the_doi")}</p>
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="text-gray-700">{translate("so_dien_thoai")}</Label>
              <Input 
                id="phoneNumber"
                name="phoneNumber"
                value={profile.phoneNumber || ""}
                onChange={handleChange}
                className="mt-1 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent"
                placeholder="0123456789"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-gray-700">{translate("dia_chi")}</Label>
              <Input 
                id="address"
                name="address"
                value={profile.address || ""}
                onChange={handleChange}
                className="mt-1 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#3E503C] focus:border-transparent"
                placeholder="123 Đường ABC, Quận XYZ, TP. HCM"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-gray-700">{translate("vai_tro")}</Label>
              <Input 
                id="role"
                name="role"
                value={profile.role}
                disabled
                className="mt-1 rounded-xl border-gray-200 bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleConfirmUpdate}
            disabled={loading || !hasChanges()}
            className={`px-6 py-3 rounded-xl text-gray-700 transition-all ${
              hasChanges() ? 'bg-white hover:bg-[#7F886A]/10 border border-gray-200 shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-[#3E503C] rounded-full animate-spin"></div>
                <span>{translate("dang_xu_ly")}</span>
              </div>
            ) : (
              translate("luu_thay_doi")
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white/90 backdrop-blur-xl rounded-3xl border-gray-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-700">{translate("xac_nhan_cap_nhat")}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {translate("ban_co_chac_cap_nhat")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 mt-6">
            <Button
              onClick={() => setShowConfirmDialog(false)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
            >
              {translate("huy")}
            </Button>
            <Button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#7F886A]/10 text-gray-700 border border-gray-200 shadow-md"
            >
              {translate("xac_nhan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 