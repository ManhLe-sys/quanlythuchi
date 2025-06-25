'use client';

import { useState, useEffect } from 'react';
import { format, addHours } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onEventAdded: () => void;
  editingEvent?: {
    id: string;
    title: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    tag?: string;
  } | null;
}

interface FormData {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  tags: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

const TAG_OPTIONS = [
  { id: 'work', label: 'Công việc', color: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' },
  { id: 'meeting', label: 'Cuộc họp', color: 'bg-blue-500/20 text-blue-400 ring-blue-500/30' },
  { id: 'personal', label: 'Cá nhân', color: 'bg-purple-500/20 text-purple-400 ring-purple-500/30' },
  { id: 'important', label: 'Quan trọng', color: 'bg-rose-500/20 text-rose-400 ring-rose-500/30' },
];

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Chờ xử lý', color: 'bg-amber-500/20 text-amber-400 ring-amber-500/30' },
  { id: 'in_progress', label: 'Đang thực hiện', color: 'bg-blue-500/20 text-blue-400 ring-blue-500/30' },
  { id: 'completed', label: 'Hoàn thành', color: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' },
  { id: 'cancelled', label: 'Đã hủy', color: 'bg-rose-500/20 text-rose-400 ring-rose-500/30' },
];

const initialFormData = (selectedDate: Date): FormData => ({
  title: '',
  description: '',
  date: format(selectedDate, 'yyyy-MM-dd'),
  start_time: format(new Date().setMinutes(0), 'HH:mm'),
  end_time: format(addHours(new Date().setMinutes(0), 1), 'HH:mm'),
  location: '',
  tags: [],
  status: 'pending'
});

export default function AddEventModal({ isOpen, onClose, selectedDate, onEventAdded, editingEvent }: AddEventModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => initialFormData(selectedDate));

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        date: editingEvent.date,
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time,
        location: editingEvent.location || '',
        tags: editingEvent.tag ? editingEvent.tag.split(',') : [],
        status: editingEvent.status || 'pending'
      });
    } else {
      setFormData(initialFormData(selectedDate));
    }
  }, [editingEvent, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate time
    const startHour = parseInt(formData.start_time.split(':')[0]);
    const startMinute = parseInt(formData.start_time.split(':')[1]);
    const endHour = parseInt(formData.end_time.split(':')[0]);
    const endMinute = parseInt(formData.end_time.split(':')[1]);
    
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      toast({
        title: 'Lỗi',
        description: 'Thời gian kết thúc phải sau thời gian bắt đầu',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Submitting form data:', formData); // Debug log
      const response = await fetch('/api/schedule', {
        method: editingEvent ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          ...(editingEvent && { id: editingEvent.id }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }

      const savedData = await response.json();
      console.log('Saved event data:', savedData); // Debug log

      toast({
        title: 'Thành công',
        description: editingEvent ? 'Đã cập nhật sự kiện' : 'Đã thêm sự kiện mới',
      });

      onClose();
      onEventAdded();
      setFormData(initialFormData(selectedDate));
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu sự kiện. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (newStatus: FormData['status']) => {
    console.log('Changing status to:', newStatus); // Debug log
    setFormData(prev => ({
      ...prev,
      status: newStatus
    }));
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700/50">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3 text-slate-200">
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </motion.div>
              {editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
            </DialogTitle>
            <p className="text-sm text-slate-400 mt-1">
              Ngày: {format(selectedDate, 'dd/MM/yyyy')}
            </p>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <line x1="19" y1="4" x2="10" y2="4"></line>
                  <line x1="14" y1="20" x2="5" y2="20"></line>
                  <line x1="15" y1="4" x2="9" y2="20"></line>
                </svg>
                Tiêu đề <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-900/50 border-slate-700 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/30 transition-shadow duration-200"
                placeholder="Nhập tiêu đề sự kiện"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <line x1="21" y1="10" x2="3" y2="10"></line>
                  <line x1="21" y1="6" x2="3" y2="6"></line>
                  <line x1="21" y1="14" x2="3" y2="14"></line>
                  <line x1="21" y1="18" x2="3" y2="18"></line>
                </svg>
                Mô tả
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-900/50 border-slate-700 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/30 transition-shadow duration-200 min-h-[100px]"
                placeholder="Nhập mô tả chi tiết về sự kiện"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-slate-300 font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Thời gian bắt đầu <span className="text-rose-400">*</span>
                </Label>
                <Input
                  type="time"
                  id="start_time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full bg-slate-900/50 border-slate-700 text-slate-200 focus:ring-2 focus:ring-emerald-500/30 transition-shadow duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-slate-300 font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 8 14"></polyline>
                  </svg>
                  Thời gian kết thúc <span className="text-rose-400">*</span>
                </Label>
                <Input
                  type="time"
                  id="end_time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full bg-slate-900/50 border-slate-700 text-slate-200 focus:ring-2 focus:ring-emerald-500/30 transition-shadow duration-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-300 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Địa điểm
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-900/50 border-slate-700 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/30 transition-shadow duration-200"
                placeholder="Nhập địa điểm diễn ra sự kiện"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                Nhãn
              </Label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
                      ${formData.tags.includes(tag.id)
                        ? `${tag.color} ring-1`
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }
                    `}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Trạng thái
              </Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => handleStatusChange(status.id as FormData['status'])}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
                      ${formData.status === status.id
                        ? `${status.color} ring-1`
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }
                    `}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </div>
                ) : (
                  editingEvent ? 'Cập nhật' : 'Tạo sự kiện'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 