'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  } | null;
}

const TAG_OPTIONS = [
  { id: 'work', label: 'Công việc', color: 'bg-blue-100 text-blue-700 ring-blue-500' },
  { id: 'meeting', label: 'Cuộc họp', color: 'bg-indigo-100 text-indigo-700 ring-indigo-500' },
  { id: 'personal', label: 'Cá nhân', color: 'bg-sky-100 text-sky-700 ring-sky-500' },
  { id: 'important', label: 'Quan trọng', color: 'bg-violet-100 text-violet-700 ring-violet-500' },
];

export default function AddEventModal({ isOpen, onClose, selectedDate, onEventAdded, editingEvent }: AddEventModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '09:00',
    end_time: '10:00',
    location: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time,
        location: editingEvent.location || '',
        tags: [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        start_time: '09:00',
        end_time: '10:00',
        location: '',
        tags: [],
      });
    }
  }, [editingEvent]);

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
      const response = await fetch('/api/schedule', {
        method: editingEvent ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          date: format(selectedDate, 'yyyy-MM-dd'),
          ...(editingEvent && { id: editingEvent.id }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }

      toast({
        title: 'Thành công',
        description: editingEvent ? 'Đã cập nhật sự kiện' : 'Đã thêm sự kiện mới',
      });

      onClose();
      onEventAdded();
      setFormData({
        title: '',
        description: '',
        start_time: '09:00',
        end_time: '10:00',
        location: '',
        tags: [],
      });
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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-lg shadow-xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-b from-white to-blue-50"
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3 text-blue-900">
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </motion.div>
              {editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
            </DialogTitle>
            <p className="text-sm text-blue-600 mt-1">
              Ngày: {format(selectedDate, 'dd/MM/yyyy')}
            </p>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-blue-700 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <line x1="19" y1="4" x2="10" y2="4"></line>
                  <line x1="14" y1="20" x2="5" y2="20"></line>
                  <line x1="15" y1="4" x2="9" y2="20"></line>
                </svg>
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 bg-white border-blue-100 text-blue-900 placeholder-blue-300"
                placeholder="Nhập tiêu đề sự kiện"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-blue-700 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
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
                className="w-full min-h-[100px] focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 bg-white border-blue-100 text-blue-900 placeholder-blue-300"
                placeholder="Nhập mô tả chi tiết về sự kiện"
                style={{ backgroundColor: 'white', color: '#1e40af' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-blue-700 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Địa điểm
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 bg-white border-blue-100 text-blue-900 placeholder-blue-300"
                placeholder="Nhập địa điểm diễn ra sự kiện"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-blue-700 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                Thẻ tag
              </Label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 
                      hover:scale-105 hover:shadow-md
                      ${formData.tags.includes(tag.id)
                        ? `${tag.color} ring-2 ring-offset-2`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-blue-700 font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Thời gian bắt đầu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 bg-white border-blue-100 text-blue-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-blue-700 font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 8 14"></polyline>
                  </svg>
                  Thời gian kết thúc <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 bg-white border-blue-100 text-blue-900"
                  required
                />
              </div>
            </div>

            <motion.div 
              className="flex justify-end space-x-3 pt-4 border-t border-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="min-w-[100px] bg-white hover:bg-blue-50 text-blue-700 border-blue-200 transition-all duration-200 hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:bg-blue-400"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {editingEvent ? 'Đang cập nhật...' : 'Đang thêm...'}
                  </div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    {editingEvent ? 'Cập nhật sự kiện' : 'Thêm sự kiện'}
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 