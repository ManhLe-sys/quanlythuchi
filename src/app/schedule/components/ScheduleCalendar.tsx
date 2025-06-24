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

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  created_by: string;
  last_updated_at: string;
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

export default function ScheduleCalendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const date = format(currentDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/schedule?date=${date}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu sự kiện. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsAddEventModalOpen(true);
  };

  const getEventsByDate = (date: Date): Event[] => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: vi });
    const endDate = endOfWeek(monthEnd, { locale: vi });

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    const rows: React.ReactElement[] = [];
    let days: React.ReactElement[] = [];

    // Render header
    const header = (
      <div className="grid grid-cols-7 bg-gradient-to-r from-blue-50 to-blue-100">
        {[...Array(7)].map((_, i) => {
          const day = addDays(startDate, i);
          const dayLabel = getWeekdayLabel(day);
          return (
            <div
              key={i}
              className={`
                py-3 text-center font-semibold border-b border-blue-200
                ${dayLabel === 'CN' ? 'text-red-600' : 'text-gray-700'}
              `}
            >
              <div className="text-lg">{dayLabel}</div>
            </div>
          );
        })}
      </div>
    );

    // Render calendar days
    daysInMonth.forEach((date, i) => {
      const dayEvents = getEventsByDate(date);
      const isCurrentMonth = isSameMonth(date, monthStart);
      const isToday = isSameDay(date, new Date());
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      days.push(
        <motion.div
          key={date.toString()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`
            min-h-[120px] p-2 border relative cursor-pointer transition-all duration-200
            ${isCurrentMonth ? 'bg-white' : COLOR_SCHEME.primary.light.bg}
            ${isToday ? `ring-2 ring-blue-400 ring-opacity-50` : ''}
            ${isSelected ? 'ring-2 ring-blue-600' : ''}
            ${COLOR_SCHEME.primary.light.hover}
            group
          `}
          onClick={() => handleDateClick(date)}
        >
          <div className="flex items-center justify-between mb-1">
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full font-medium
                ${isToday ? `${COLOR_SCHEME.primary.bg} text-white` : ''}
                ${isSelected ? `${COLOR_SCHEME.primary.bg} text-white` : ''}
                ${!isToday && !isSelected ? COLOR_SCHEME.text.primary : ''}
                transition-all duration-200 group-hover:scale-110
              `}
            >
              {format(date, 'd')}
            </div>
            {dayEvents.length > 0 && (
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {dayEvents.length}
              </span>
            )}
          </div>

          <div className="space-y-1">
            {dayEvents.map((event) => {
              // Determine event type based on title or description
              let eventType: EventType = 'normal';
              const eventText = (event.title + ' ' + event.description).toLowerCase();
              if (eventText.includes('meeting') || eventText.includes('cuộc họp')) {
                eventType = 'meeting';
              } else if (eventText.includes('important') || eventText.includes('quan trọng')) {
                eventType = 'important';
              } else if (eventText.includes('work') || eventText.includes('công việc')) {
                eventType = 'work';
              }

              return (
                <div
                  key={event.id}
                  className={`
                    text-xs p-1.5 rounded-md truncate shadow-sm
                    transition-all duration-200 hover:scale-105 cursor-pointer
                    ${COLOR_SCHEME.event[eventType].bg}
                    ${COLOR_SCHEME.event[eventType].text}
                    ${COLOR_SCHEME.event[eventType].hover}
                  `}
                  title={`${event.title} (${event.start_time} - ${event.end_time})`}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-xs opacity-75 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {event.start_time} - {event.end_time}
                  </div>
                  {event.location && (
                    <div className="text-xs opacity-75 flex items-center gap-1 truncate">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {event.location}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      );

      if ((i + 1) % 7 === 0) {
        rows.push(
          <div key={date.toString()} className="grid grid-cols-7 divide-x divide-blue-100">
            {days}
          </div>
        );
        days = [];
      }
    });

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-200">
        {header}
        <div className="divide-y divide-blue-100">
          {rows}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: vi });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-200">
        {/* Header */}
        <div className="grid grid-cols-8 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="py-3 text-center font-semibold text-sm border-b border-blue-200">
            Giờ
          </div>
          {days.map((day) => {
            const dayLabel = getWeekdayLabel(day);
            return (
              <div
                key={day.toString()}
                className={`
                  py-3 text-center font-semibold border-b border-blue-200
                  ${isSameDay(day, new Date()) ? 'bg-blue-100' : ''}
                `}
              >
                <div className={`text-lg ${dayLabel === 'CN' ? 'text-red-600' : 'text-gray-700'}`}>
                  {dayLabel}
                </div>
                <div className={`text-sm ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-500'}`}>
                  {format(day, 'dd/MM')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-8 divide-x divide-blue-100">
          {/* Time labels */}
          <div className="divide-y divide-blue-100">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-12 text-xs text-gray-500 text-right pr-2 pt-1">
                {`${i.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Events for each day */}
          {days.map((day) => (
            <div key={day.toString()} className="relative">
              <div className="absolute inset-0 divide-y divide-blue-100">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="h-12"></div>
                ))}
              </div>

              {getEventsByDate(day).map((event) => {
                const startHour = parseInt(event.start_time.split(':')[0]);
                const startMinute = parseInt(event.start_time.split(':')[1]);
                const endHour = parseInt(event.end_time.split(':')[0]);
                const endMinute = parseInt(event.end_time.split(':')[1]);
                const top = startHour * 48 + startMinute * 0.8;
                const height = (endHour - startHour) * 48 + (endMinute - startMinute) * 0.8;

                // Determine event type
                let eventType: EventType = 'normal';
                const eventText = (event.title + ' ' + event.description).toLowerCase();
                if (eventText.includes('meeting') || eventText.includes('cuộc họp')) {
                  eventType = 'meeting';
                } else if (eventText.includes('important') || eventText.includes('quan trọng')) {
                  eventType = 'important';
                } else if (eventText.includes('work') || eventText.includes('công việc')) {
                  eventType = 'work';
                }

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`
                      absolute left-0 right-0 mx-1 p-1.5 rounded shadow-sm
                      ${COLOR_SCHEME.event[eventType].bg}
                      ${COLOR_SCHEME.event[eventType].text}
                      transition-all duration-200 hover:scale-[1.02] cursor-pointer
                      text-xs overflow-hidden
                    `}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-75 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {event.start_time} - {event.end_time}
                    </div>
                    {event.location && (
                      <div className="text-xs opacity-75 flex items-center gap-1 truncate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {event.location}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-200">
        {/* Header */}
        <div className="grid grid-cols-1 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="py-3 text-center font-semibold border-b border-blue-200">
            <div className={`text-2xl ${getWeekdayLabel(currentDate) === 'CN' ? 'text-red-600' : 'text-gray-700'}`}>
              {getWeekdayLabel(currentDate)}
            </div>
            <div className="text-sm text-blue-600">{format(currentDate, 'dd/MM/yyyy')}</div>
          </div>
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-8">
          {/* Time labels */}
          <div className="divide-y divide-blue-100">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-12 text-xs text-gray-500 text-right pr-2 pt-1">
                {`${i.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Events */}
          <div className="col-span-7 relative">
            <div className="absolute inset-0 divide-y divide-blue-100">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="h-12"></div>
              ))}
            </div>

            {getEventsByDate(currentDate).map((event) => {
              const startHour = parseInt(event.start_time.split(':')[0]);
              const startMinute = parseInt(event.start_time.split(':')[1]);
              const endHour = parseInt(event.end_time.split(':')[0]);
              const endMinute = parseInt(event.end_time.split(':')[1]);
              const top = startHour * 48 + startMinute * 0.8;
              const height = (endHour - startHour) * 48 + (endMinute - startMinute) * 0.8;

              // Determine event type
              let eventType: EventType = 'normal';
              const eventText = (event.title + ' ' + event.description).toLowerCase();
              if (eventText.includes('meeting') || eventText.includes('cuộc họp')) {
                eventType = 'meeting';
              } else if (eventText.includes('important') || eventText.includes('quan trọng')) {
                eventType = 'important';
              } else if (eventText.includes('work') || eventText.includes('công việc')) {
                eventType = 'work';
              }

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    absolute left-0 right-0 mx-1 p-2 rounded shadow-sm
                    ${COLOR_SCHEME.event[eventType].bg}
                    ${COLOR_SCHEME.event[eventType].text}
                    transition-all duration-200 hover:scale-[1.02] cursor-pointer
                    text-xs overflow-hidden
                  `}
                  style={{ top: `${top}px`, height: `${height}px` }}
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs opacity-75 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {event.start_time} - {event.end_time}
                  </div>
                  {event.location && (
                    <div className="text-xs opacity-75 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {event.location}
                    </div>
                  )}
                  {event.description && (
                    <div className="text-xs opacity-75 mt-1">{event.description}</div>
                  )}
                </motion.div>
              );
            })}

            {/* Current time indicator */}
            {isSameDay(currentDate, new Date()) && (
              <div
                className="absolute left-0 right-0 flex items-center"
                style={{
                  top: `${new Date().getHours() * 48 + new Date().getMinutes() * 0.8}px`,
                  zIndex: 10
                }}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 ml-1"></div>
                <div className="flex-1 h-px bg-red-500 ml-1"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handlePrevious = () => {
    setCurrentDate(prev => 
      currentView === 'month' 
        ? subMonths(prev, 1)
        : subDays(prev, 7)
    );
  };

  const handleNext = () => {
    setCurrentDate(prev => 
      currentView === 'month' 
        ? addMonths(prev, 1)
        : addDays(prev, 7)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch làm việc</h1>
        <p className="text-gray-600">Quản lý và theo dõi lịch trình công việc của bạn một cách hiệu quả</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${COLOR_SCHEME.primary.light.bg} ${COLOR_SCHEME.primary.text}
              hover:bg-blue-100 active:bg-blue-200
              flex items-center justify-center
            `}
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${isSameDay(currentDate, new Date())
                ? `${COLOR_SCHEME.primary.bg} text-white hover:bg-blue-700 active:bg-blue-800`
                : `${COLOR_SCHEME.primary.light.bg} ${COLOR_SCHEME.primary.text} hover:bg-blue-100 active:bg-blue-200`
              }
              flex items-center gap-2
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Hôm nay
          </button>

          <button
            onClick={handleNext}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${COLOR_SCHEME.primary.light.bg} ${COLOR_SCHEME.primary.text}
              hover:bg-blue-100 active:bg-blue-200
              flex items-center justify-center
            `}
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <h2 className={`text-xl font-semibold ${COLOR_SCHEME.primary.textDark}`}>
            {format(currentDate, currentView === 'month' ? 'MMMM yyyy' : 'dd MMMM yyyy', { locale: vi })}
          </h2>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setCurrentView(option.id as 'month' | 'week' | 'day')}
                className={`
                  px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                  ${currentView === option.id
                    ? `${COLOR_SCHEME.primary.bg} text-white shadow-sm`
                    : `text-gray-600 hover:text-gray-900 hover:bg-white/60`
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </div>

      {/* Add Event Modal */}
      {selectedDate && (
        <AddEventModal
          isOpen={isAddEventModalOpen}
          onClose={() => {
            setIsAddEventModalOpen(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
          onEventAdded={fetchEvents}
        />
      )}
    </div>
  );
} 