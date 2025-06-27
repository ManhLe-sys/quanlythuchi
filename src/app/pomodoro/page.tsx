'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PomodoroTimer, PomodoroLogs } from './components';
import YouTubePlayer from './components/YouTubePlayer';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

export default function PomodoroPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
  });

  const [currentSession, setCurrentSession] = useState<{
    isActive: boolean;
    type: 'work' | 'shortBreak' | 'longBreak';
    timeLeft: number;
    currentCycle: number;
  }>({
    isActive: false,
    type: 'work',
    timeLeft: settings.workDuration * 60,
    currentCycle: 1,
  });

  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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

      <div className="container mx-auto p-4 py-8 space-y-8 relative z-10">
        <div className="flex justify-between items-center">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400">
              Pomodoro Timer
            </h1>
            <p className="text-slate-300">Stay focused and productive</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="w-10 h-10 border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm"
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5 text-slate-300" />
            ) : (
              <Maximize2 className="h-5 w-5 text-slate-300" />
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timer Section */}
          <Card className="p-8 bg-slate-800/30 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 transition-all duration-300">
            <PomodoroTimer
              currentSession={currentSession}
              setCurrentSession={setCurrentSession}
              settings={settings}
              setSettings={setSettings}
            />
          </Card>

          {/* Right Section */}
          <div className="space-y-4">
            {/* YouTube Player Section */}
            <Card className="p-6 bg-slate-800/30 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 transition-all duration-300 min-h-[400px]">
              <YouTubePlayer />
            </Card>

            {/* History Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-center gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300"
            >
              {showHistory ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide History
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show History
                </>
              )}
            </Button>

            {/* Compact History Section */}
            {showHistory && (
              <Card className="p-6 bg-slate-800/30 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 transition-all duration-300 max-h-[300px] overflow-auto">
                <PomodoroLogs compact={true} />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 