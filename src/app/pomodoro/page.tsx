'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PomodoroTimer, PomodoroLogs } from './components';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { PlaylistList } from './components/PlaylistList';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSession {
  isActive: boolean;
  type: SessionType;
  timeLeft: number;
  currentCycle: number;
}

export default function PomodoroPage() {
  const [isLarge, setIsLarge] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
  });

  const [currentSession, setCurrentSession] = useState<PomodoroSession>({
    isActive: false,
    type: 'work',
    timeLeft: settings.workDuration * 60,
    currentCycle: 1,
  });

  const toggleSize = () => setIsLarge(!isLarge);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Pomodoro Timer</h2>
              <Button variant="ghost" size="icon" onClick={toggleSize}>
                {isLarge ? <Minimize2 /> : <Maximize2 />}
              </Button>
            </div>
            <PomodoroTimer
              currentSession={currentSession}
              setCurrentSession={setCurrentSession}
              settings={settings}
              setSettings={setSettings}
            />
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Playlists</h2>
              <CreatePlaylistModal onPlaylistCreated={() => {
                toast({
                  title: "Success",
                  description: "Playlist created successfully",
                });
              }} />
            </div>
            <PlaylistList />
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Pomodoro Logs</h2>
            </div>
            <PomodoroLogs />
          </Card>
        </div>
      </div>
    </div>
  );
} 