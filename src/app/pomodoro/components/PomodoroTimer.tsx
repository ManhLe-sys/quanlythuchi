'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';

interface PomodoroTimerProps {
  currentSession: {
    isActive: boolean;
    type: 'work' | 'shortBreak' | 'longBreak';
    timeLeft: number;
    currentCycle: number;
  };
  setCurrentSession: React.Dispatch<React.SetStateAction<{
    isActive: boolean;
    type: 'work' | 'shortBreak' | 'longBreak';
    timeLeft: number;
    currentCycle: number;
  }>>;
  settings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    cyclesBeforeLongBreak: number;
  };
  setSettings: React.Dispatch<React.SetStateAction<{
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    cyclesBeforeLongBreak: number;
  }>>;
}

export default function PomodoroTimer({
  currentSession,
  setCurrentSession,
  settings,
  setSettings,
}: PomodoroTimerProps) {
  const { toast } = useToast();
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(100);
  const [showSettings, setShowSettings] = useState(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSessionDuration = (type: 'work' | 'shortBreak' | 'longBreak'): number => {
    switch (type) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(console.error);
  };

  const handleStart = () => {
    if (!currentSession.isActive) {
      setShowSettings(false);
      setCurrentSession(prev => ({ ...prev, isActive: true }));
      const totalDuration = getSessionDuration(currentSession.type);
      
      const id = setInterval(() => {
        setCurrentSession(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          setProgress((newTimeLeft / totalDuration) * 100);
          
          if (newTimeLeft <= 0) {
            clearInterval(id);
            playNotificationSound();
            
            let nextType: 'work' | 'shortBreak' | 'longBreak';
            let nextCycle = prev.currentCycle;
            let nextTimeLeft: number;

            if (prev.type === 'work') {
              if (prev.currentCycle >= settings.cyclesBeforeLongBreak) {
                nextType = 'longBreak';
                nextTimeLeft = settings.longBreakDuration * 60;
                nextCycle = 1;
              } else {
                nextType = 'shortBreak';
                nextTimeLeft = settings.shortBreakDuration * 60;
                nextCycle = prev.currentCycle + 1;
              }
            } else {
              nextType = 'work';
              nextTimeLeft = settings.workDuration * 60;
            }

            toast({
              title: 'Session Complete!',
              description: `${prev.type.charAt(0).toUpperCase() + prev.type.slice(1)} session completed. Starting ${nextType} session.`,
            });

            return {
              ...prev,
              isActive: false,
              type: nextType,
              timeLeft: nextTimeLeft,
              currentCycle: nextCycle,
            };
          }

          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
      setIntervalId(id);
    }
  };

  const handlePause = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setCurrentSession(prev => ({ ...prev, isActive: false }));
    }
  };

  const handleReset = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    const resetTimeLeft = getSessionDuration('work');
    setProgress(100);
    setCurrentSession(prev => ({
      ...prev,
      isActive: false,
      type: 'work',
      timeLeft: resetTimeLeft,
      currentCycle: 1,
    }));
    setShowSettings(false);
  };

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const getTypeColor = () => {
    switch (currentSession.type) {
      case 'work':
        return 'from-rose-500 to-orange-500';
      case 'shortBreak':
        return 'from-teal-500 to-cyan-500';
      case 'longBreak':
        return 'from-blue-500 to-indigo-500';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative">
        {/* Timer Circle */}
        <div className="relative w-72 h-72">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-700" />
          
          {/* Progress circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              strokeWidth="8"
              fill="none"
              className={`stroke-current text-gradient ${getTypeColor()}`}
              style={{
                strokeDasharray: '283',
                strokeDashoffset: 283 - (283 * progress) / 100,
              }}
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          
          {/* Timer text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={currentSession.timeLeft}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-gray-900 dark:text-white"
            >
              {formatTime(currentSession.timeLeft)}
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl font-medium text-gray-600 dark:text-gray-300"
            >
              {currentSession.type.charAt(0).toUpperCase() + currentSession.type.slice(1)}
              {currentSession.type === 'work' && ` (${currentSession.currentCycle}/${settings.cyclesBeforeLongBreak})`}
            </motion.div>
          </div>

          {/* Settings Button - Now positioned absolutely */}
          {!currentSession.isActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Settings2 className={`h-5 w-5 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </Button>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4 mt-16">
          <Button
            onClick={currentSession.isActive ? handlePause : handleStart}
            variant={currentSession.isActive ? "destructive" : "default"}
            size="lg"
            className="w-32 font-medium"
          >
            {currentSession.isActive ? (
              <Pause className="h-5 w-5 mr-2" />
            ) : (
              <Play className="h-5 w-5 mr-2" />
            )}
            {currentSession.isActive ? 'Pause' : 'Start'}
          </Button>
          <Button 
            onClick={handleReset} 
            variant="outline"
            size="lg"
            className="w-32 font-medium"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Settings Panel with Animation */}
      <AnimatePresence>
        {showSettings && !currentSession.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-4 p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="w-24 text-sm">Work</label>
                <Input
                  type="number"
                  min="1"
                  value={settings.workDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setSettings(prev => ({
                      ...prev,
                      workDuration: value
                    }));
                    if (currentSession.type === 'work' && !currentSession.isActive) {
                      setCurrentSession(prev => ({
                        ...prev,
                        timeLeft: value * 60
                      }));
                    }
                  }}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-24 text-sm">Short Break</label>
                <Input
                  type="number"
                  min="1"
                  value={settings.shortBreakDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setSettings(prev => ({
                      ...prev,
                      shortBreakDuration: value
                    }));
                    if (currentSession.type === 'shortBreak' && !currentSession.isActive) {
                      setCurrentSession(prev => ({
                        ...prev,
                        timeLeft: value * 60
                      }));
                    }
                  }}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-24 text-sm">Long Break</label>
                <Input
                  type="number"
                  min="1"
                  value={settings.longBreakDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setSettings(prev => ({
                      ...prev,
                      longBreakDuration: value
                    }));
                    if (currentSession.type === 'longBreak' && !currentSession.isActive) {
                      setCurrentSession(prev => ({
                        ...prev,
                        timeLeft: value * 60
                      }));
                    }
                  }}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-24 text-sm">Cycles</label>
                <Input
                  type="number"
                  min="1"
                  value={settings.cyclesBeforeLongBreak}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cyclesBeforeLongBreak: parseInt(e.target.value) || 1
                  }))}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">rounds</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 