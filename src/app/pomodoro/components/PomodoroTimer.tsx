'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

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

  const logSession = async (type: string, startTime: Date, duration: number) => {
    try {
      console.log('Logging session:', {
        type,
        startTime: startTime.toISOString(),
        duration
      });

      const response = await fetch('/api/pomodoro/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: uuidv4(),
          user_id: '', // Can be populated with actual user ID if available
          type,
          start_time: startTime.toISOString(),
          duration,
          note: `Cycle ${currentSession.currentCycle} of ${settings.cyclesBeforeLongBreak}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to log session');
      }

      toast({
        title: 'Session Logged',
        description: `${type} session of ${duration} minutes has been logged successfully.`,
      });

    } catch (error) {
      console.error('Error logging session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to log session',
        variant: 'destructive',
      });
    }
  };

  const handleStart = () => {
    if (!currentSession.isActive) {
      setShowSettings(false);
      setSessionStartTime(new Date());
      setCurrentSession(prev => ({ ...prev, isActive: true }));
      const totalDuration = getSessionDuration(currentSession.type);
      
      const id = setInterval(() => {
        setCurrentSession(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          setProgress((newTimeLeft / totalDuration) * 100);
          
          if (newTimeLeft <= 0) {
            clearInterval(id);
            playNotificationSound();
            
            // Log completed session
            if (sessionStartTime) {
              const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60);
              logSession(prev.type, sessionStartTime, duration);
            }
            
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
      
      // Log partial session
      if (sessionStartTime) {
        const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60);
        logSession(currentSession.type + '_paused', sessionStartTime, duration);
        setSessionStartTime(null);
      }
    }
  };

  const handleReset = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    // Log reset session if it was active
    if (sessionStartTime && currentSession.isActive) {
      const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60);
      logSession(currentSession.type + '_reset', sessionStartTime, duration);
      setSessionStartTime(null);
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
        return 'from-rose-500 via-orange-400 to-amber-500';
      case 'shortBreak':
        return 'from-emerald-500 via-teal-400 to-cyan-500';
      case 'longBreak':
        return 'from-blue-500 via-indigo-400 to-violet-500';
    }
  };

  const getTypeText = () => {
    switch (currentSession.type) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative">
        {/* Timer Circle */}
        <div className="relative w-72 h-72">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full bg-slate-700/50 backdrop-blur-sm" />
          
          {/* Progress circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              strokeWidth="8"
              fill="none"
              className={`stroke-current bg-gradient-to-r ${getTypeColor()}`}
              style={{
                strokeDasharray: '283',
                strokeDashoffset: 283 - (283 * progress) / 100,
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))'
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
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <h2 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                {formatTime(currentSession.timeLeft)}
              </h2>
              <p className="mt-2 text-lg text-slate-300 font-medium">
                {getTypeText()}
              </p>
              <p className="text-sm text-slate-400">
                Cycle {currentSession.currentCycle} of {settings.cyclesBeforeLongBreak}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={currentSession.isActive ? handlePause : handleStart}
          className="w-32 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 backdrop-blur-sm text-slate-300"
        >
          {currentSession.isActive ? (
            <Pause className="mr-2 h-4 w-4" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {currentSession.isActive ? 'Pause' : 'Start'}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleReset}
          className="w-32 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 backdrop-blur-sm text-slate-300"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowSettings(!showSettings)}
          className="w-32 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 backdrop-blur-sm text-slate-300"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 p-6 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Work Duration (min)</label>
                <Input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) || 1 }))}
                  className="bg-slate-900/50 border-slate-700 text-slate-300"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Short Break (min)</label>
                <Input
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) || 1 }))}
                  className="bg-slate-900/50 border-slate-700 text-slate-300"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Long Break (min)</label>
                <Input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) || 1 }))}
                  className="bg-slate-900/50 border-slate-700 text-slate-300"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Cycles Before Long Break</label>
                <Input
                  type="number"
                  value={settings.cyclesBeforeLongBreak}
                  onChange={(e) => setSettings(prev => ({ ...prev, cyclesBeforeLongBreak: parseInt(e.target.value) || 1 }))}
                  className="bg-slate-900/50 border-slate-700 text-slate-300"
                  min="1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 