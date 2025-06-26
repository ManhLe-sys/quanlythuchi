'use client';

import { useState, useEffect } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO, 
  addMonths, 
  subMonths, 
  endOfWeek,
  subDays
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import AddEventModal from './AddEventModal';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  created_by?: string;
  last_updated_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tag?: string;
}

interface EditEventData {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tag?: string;
}

type EventType = 'work' | 'meeting' | 'important' | 'normal';

const VIEW_OPTIONS = [
  { id: 'month', label: 'Tháng' },
  { id: 'week', label: 'Tuần' },
  { id: 'day', label: 'Ngày' },
];

const COLOR_SCHEME = {
  primary: {
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    text: 'text-blue-600',
    textDark: 'text-blue-800',
    border: 'border-blue-200',
    light: {
      bg: 'bg-blue-50',
      hover: 'hover:bg-blue-100',
      border: 'border-blue-100'
    }
  },
  event: {
    work: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-200'
    },
    meeting: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      hover: 'hover:bg-purple-200'
    },
    important: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      hover: 'hover:bg-red-200'
    },
    normal: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      hover: 'hover:bg-gray-200'
    }
  },
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    light: 'text-gray-400'
  }
} as const;

type WeekdayKey = 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7' | 'Chủ Nhật';

const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  'Thứ 2': 'T2',
  'Thứ 3': 'T3',
  'Thứ 4': 'T4',
  'Thứ 5': 'T5',
  'Thứ 6': 'T6',
  'Thứ 7': 'T7',
  'Chủ Nhật': 'CN'
};

const getWeekdayLabel = (date: Date): string => {
  const fullDay = format(date, 'EEEE', { locale: vi }) as WeekdayKey;
  return WEEKDAY_LABELS[fullDay] || fullDay;
};

interface ScheduleCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const getStatusColor = (status: Event['status']) => {
  switch (status) {
    case 'pending':
      return 'text-amber-300 border-amber-400/30';
    case 'in_progress':
      return 'text-blue-300 border-blue-400/30';
    case 'completed':
      return 'text-emerald-300 border-emerald-400/30';
    case 'cancelled':
      return 'text-rose-300 border-rose-400/30';
    default:
      return 'text-slate-300 border-slate-400/30';
  }
};

const getStatusBg = (status: Event['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-400/10';
    case 'in_progress':
      return 'bg-blue-400/10';
    case 'completed':
      return 'bg-emerald-400/10';
    case 'cancelled':
      return 'bg-rose-400/10';
    default:
      return 'bg-slate-400/10';
  }
};

const getStatusLabel = (status: Event['status']) => {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý';
    case 'in_progress':
      return 'Đang thực hiện';
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

export default function ScheduleCalendar({ selectedDate: propSelectedDate, onDateChange }: ScheduleCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(propSelectedDate);
  const [events, setEvents] = useState<Event[]>([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<EditEventData | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [showTableView, setShowTableView] = useState(false);

  useEffect(() => {
    setCurrentDate(propSelectedDate);
  }, [propSelectedDate]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/schedule', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      console.log('Fetched events:', data); // Debug log
      if (data && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        console.warn('Received invalid events data:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu sự kiện. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDateClick = (date: Date) => {
    onDateChange(date);
    setIsAddEventModalOpen(true);
    setEditingEvent(null);
  };

  const handleEditEvent = (event: Event) => {
    onDateChange(parseISO(event.date));
    setEditingEvent({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location || '',
      status: event.status,
      tag: event.tag
    });
    setIsAddEventModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/schedule?id=${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast({
        title: 'Thành công',
        description: 'Đã xóa sự kiện',
      });

      fetchEvents();
      setDeleteEventId(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa sự kiện. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const getEventType = (event: Event): EventType => {
    const title = event.title.toLowerCase();
    if (title.includes('họp') || title.includes('meeting')) return 'meeting';
    if (title.includes('work') || title.includes('task')) return 'work';
    if (title.includes('urgent') || title.includes('important')) return 'important';
    return 'normal';
  };

  const renderEventInCalendar = (event: Event | undefined, isInline: boolean = false) => {
    if (!event) return null;
    
    const eventDate = parseISO(event.date);
    const isSelected = isSameDay(eventDate, propSelectedDate);
    const statusColor = getStatusColor(event.status);
    const statusBg = getStatusBg(event.status);

    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`
          group relative cursor-pointer
          backdrop-blur-sm bg-white/5
          border border-white/10 hover:border-white/20
          transition-all duration-200 ease-out
          ${isInline ? 'mb-1 last:mb-0' : 'mb-2'}
          overflow-hidden
        `}
        onClick={(e) => {
          e.stopPropagation();
          handleEditEvent(event);
        }}
      >
        {/* Status Indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusBg}`} />
        
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h4 className="text-[13px] font-medium text-white/90 mb-1.5 line-clamp-1">
                {event.title}
              </h4>
              
              {/* Info Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status */}
                <div className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${statusBg} ${statusColor}`}>
                  {getStatusLabel(event.status)}
                </div>

                {/* Tags */}
                {event.tag && event.tag.split(',').map((tag: string, index: number) => (
                  <span 
                    key={index}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/60 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEvent(event);
                }}
                className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteEventId(event.id);
                }}
                className="p-1 rounded-md hover:bg-rose-500/20 text-white/70 hover:text-rose-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const getEventsByDate = (date: Date): Event[] => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  };

  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeek = startOfWeek(start, { weekStartsOn: 1 });
    const endWeek = endOfWeek(end, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startWeek, end: endWeek });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-700/20">
        {/* Weekday headers */}
        {days.slice(0, 7).map((day, index) => (
          <div
            key={index}
            className="p-2 text-center text-sm font-medium text-slate-300 bg-slate-800/30"
          >
            {getWeekdayLabel(day)}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, dayIdx) => {
          const dayEvents = getEventsByDate(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, propSelectedDate);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                min-h-[120px] p-2 transition-all duration-200 cursor-pointer
                ${isCurrentMonth ? 'bg-slate-800/30' : 'bg-slate-800/50'}
                ${isSelected ? 'ring-2 ring-emerald-500/50 bg-emerald-500/10' : ''}
                hover:bg-slate-700/50
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`
                    text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center
                    ${isToday ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300'}
                    ${!isCurrentMonth && 'opacity-50'}
                  `}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => renderEventInCalendar(event, true))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-slate-400 mt-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    onDateChange(date);
    setIsAddEventModalOpen(true);
    setEditingEvent(null);
  };

  const renderWeekView = () => {
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 gap-px bg-slate-700/20">
            <div className="p-2 text-center text-sm font-medium text-slate-300 bg-slate-800/30">
              Time
            </div>
            {days.map(day => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, propSelectedDate);

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    p-2 text-center transition-all duration-200
                    ${isSelected ? 'bg-emerald-500/20' : 'bg-slate-800/30'}
                  `}
                >
                  <div className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {getWeekdayLabel(day)}
                  </div>
                  <div className={`text-xs mt-1 ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div className="grid grid-cols-8 gap-px bg-slate-700/20">
            {hours.map(hour => (
              <React.Fragment key={hour}>
                <div className="p-2 text-xs text-slate-400 bg-slate-800/30">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
                {days.map(day => {
                  const dayEvents = getEventsByDate(day).filter(event => {
                    const eventHour = parseInt(event.start_time.split(':')[0]);
                    return eventHour === hour;
                  });

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      onClick={() => handleTimeSlotClick(day, hour)}
                      className="p-2 min-h-[60px] bg-slate-800/30 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
                    >
                      {dayEvents.map(event => renderEventInCalendar(event))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const hourEvents = events.filter(event => {
            const eventDate = parseISO(event.date);
            const eventHour = parseInt(event.start_time.split(':')[0]);
            return isSameDay(eventDate, propSelectedDate) && eventHour === hour;
          });

          return (
            <div
              key={hour}
              className="grid grid-cols-[100px,1fr] gap-4 group"
              onClick={() => handleTimeSlotClick(propSelectedDate, hour)}
            >
              <div className="p-2 text-sm text-slate-400 text-right">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              <div className="p-2 min-h-[60px] bg-slate-800/30 group-hover:bg-slate-700/50 transition-all duration-200 rounded-lg cursor-pointer">
                {hourEvents.map(event => renderEventInCalendar(event))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handlePrevious = () => {
    switch (currentView) {
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => subDays(prev, 7));
        break;
      case 'day':
        setCurrentDate(prev => subDays(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (currentView) {
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addDays(prev, 7));
        break;
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
    }
  };

  // Helper: Lấy tất cả task theo view hiện tại
  const getAllTasksForCurrentView = () => {
    if (currentView === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return events.filter(event => {
        const eventDate = parseISO(event.date);
        return eventDate >= start && eventDate <= end;
      });
    } else if (currentView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      return events.filter(event => {
        const eventDate = parseISO(event.date);
        return eventDate >= start && eventDate <= end;
      });
    } else {
      // day view
      return events.filter(event => isSameDay(parseISO(event.date), currentDate));
    }
  };

  // Helper: Tạo màu nổi bật cho tag
  const getTagColor = (tag: string, idx: number) => {
    const tagMap: Record<string, string> = {
      urgent: 'bg-rose-600 text-white border-rose-700',
      meeting: 'bg-blue-600 text-white border-blue-700',
      work: 'bg-emerald-600 text-white border-emerald-700',
      personal: 'bg-purple-600 text-white border-purple-700',
      important: 'bg-yellow-500 text-white border-yellow-600',
      done: 'bg-lime-600 text-white border-lime-700',
      idea: 'bg-cyan-600 text-white border-cyan-700',
      plan: 'bg-orange-500 text-white border-orange-600',
      note: 'bg-gray-600 text-white border-gray-700',
    };
    const key = tag.trim().toLowerCase();
    if (tagMap[key]) return tagMap[key];
    // Random màu cho tag khác
    const colorList = [
      'bg-pink-500 text-white border-pink-600',
      'bg-blue-500 text-white border-blue-600',
      'bg-emerald-500 text-white border-emerald-600',
      'bg-purple-500 text-white border-purple-600',
      'bg-yellow-500 text-white border-yellow-600',
      'bg-orange-500 text-white border-orange-600',
      'bg-cyan-500 text-white border-cyan-600',
      'bg-rose-500 text-white border-rose-600',
      'bg-lime-500 text-white border-lime-600',
      'bg-indigo-500 text-white border-indigo-600',
      'bg-gray-500 text-white border-gray-600',
    ];
    return colorList[idx % colorList.length];
  };

  // Helper: Màu status nổi bật
  const getStatusStyle = (status: Event['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'in_progress':
        return 'bg-blue-600 text-white border-blue-700';
      case 'completed':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'cancelled':
        return 'bg-rose-600 text-white border-rose-700';
      default:
        return 'bg-slate-500 text-white border-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* View Controls + Toggle Table */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          {VIEW_OPTIONS.map(option => (
            <Button
              key={option.id}
              variant="outline"
              size="sm"
              onClick={() => setCurrentView(option.id as 'month' | 'week' | 'day')}
              className={`
                transition-all duration-200 border-slate-700
                ${currentView === option.id
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }
              `}
              disabled={showTableView}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button
          variant={showTableView ? 'default' : 'outline'}
          className={showTableView ? 'bg-blue-500 text-white' : 'bg-slate-800/50 text-blue-400 border-blue-400/30 hover:bg-blue-500/20'}
          onClick={() => setShowTableView(v => !v)}
        >
          {showTableView ? 'Xem lịch' : 'Xem bảng công việc'}
        </Button>
      </div>

      {/* Calendar Content */}
      {!showTableView && (
        <div className="bg-slate-800/30 rounded-lg overflow-hidden border border-slate-700/50 mb-8">
          {currentView === 'month' && renderMonthView()}
          {currentView === 'week' && renderWeekView()}
          {currentView === 'day' && renderDayView()}
        </div>
      )}

      {/* Task Table */}
      {showTableView && (
        <div className="bg-slate-800/30 rounded-lg overflow-x-auto border border-slate-700/50 p-4">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4">Danh sách công việc</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Tên task</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Ngày</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Bắt đầu</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Kết thúc</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Trạng thái</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Tag</th>
                <th className="px-3 py-2 text-center text-slate-300 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {getAllTasksForCurrentView().length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-6">Không có công việc nào</td>
                </tr>
              ) : (
                getAllTasksForCurrentView().map((event, idx) => (
                  <tr key={event.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-3 py-2 text-white font-medium">{event.title}</td>
                    <td className="px-3 py-2 text-slate-300">{format(parseISO(event.date), 'dd/MM/yyyy')}</td>
                    <td className="px-3 py-2 text-slate-300">{event.start_time}</td>
                    <td className="px-3 py-2 text-slate-300">{event.end_time}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold border-2 ${getStatusStyle(event.status)}`}>{getStatusLabel(event.status)}</span>
                    </td>
                    <td className="px-3 py-2">
                      {event.tag ? event.tag.split(',').map((tag, tagIdx) => (
                        <span key={tagIdx} className={`inline-block px-2 py-1 mr-1 mb-1 rounded-full text-xs font-semibold border ${getTagColor(tag, tagIdx)}`}>{tag}</span>
                      )) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleEditEvent(event)} className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white/90 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                      <button onClick={() => setDeleteEventId(event.id)} className="p-1 rounded hover:bg-rose-500/20 text-white/70 hover:text-rose-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => {
          setIsAddEventModalOpen(false);
          setEditingEvent(null);
        }}
        selectedDate={propSelectedDate}
        editingEvent={editingEvent}
        onEventAdded={fetchEvents}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Bạn có chắc chắn muốn xóa sự kiện này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEventId && handleDeleteEvent(deleteEventId)}
              className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 