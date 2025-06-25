'use client';

import { useState } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import ScheduleCalendar from './components/ScheduleCalendar';
import AddEventModal from './components/AddEventModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SchedulePage() {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshEvents, setRefreshEvents] = useState(0);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleEventAdded = () => {
    setRefreshEvents(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Interactive Background */}
      <div className="absolute inset-0">
        <div className="nebula opacity-30"></div>
        <div className="dots-grid"></div>
        {/* Glowing lines */}
        <div className="glow-line"></div>
        <div className="glow-line"></div>
        <div className="glow-line"></div>
        {/* Floating orbs */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 mb-2">
            Lịch làm việc
          </h1>
          <p className="text-slate-300">
            Quản lý và theo dõi lịch trình công việc của bạn một cách hiệu quả
          </p>
        </div>

        {/* Main Content */}
        <Card className="p-6 bg-slate-800/30 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-slate-900/20">
          {/* Control Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-3 order-2 md:order-1">
              <Button 
                variant="outline"
                onClick={handlePreviousDay}
                className="p-2 rounded-lg transition-all duration-200 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border-slate-700
                  ${isSameDay(selectedDate, new Date())
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                  }
                  flex items-center gap-2 min-w-[120px]
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Hôm nay
              </Button>
              <Button 
                variant="outline"
                onClick={handleNextDay}
                className="p-2 rounded-lg transition-all duration-200 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Button>
            </div>

            <Button 
              onClick={() => setIsAddEventModalOpen(true)}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 min-w-[160px] shadow-sm transition-all duration-200 order-1 md:order-2 border border-emerald-500/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Thêm sự kiện
            </Button>
          </div>

          {/* Date Display */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: vi })}
            </h2>
            <div className="mt-1 text-sm text-slate-400">
              {selectedDate.toLocaleDateString() === new Date().toLocaleDateString() 
                ? 'Hôm nay'
                : 'Xem lịch theo ngày'}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <ScheduleCalendar 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </Card>
      </div>

      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        selectedDate={selectedDate}
        onEventAdded={handleEventAdded}
      />
    </div>
  );
} 