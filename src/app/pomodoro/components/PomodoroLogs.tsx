'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Log {
  id: string;
  type: string;
  startTime: string;
  duration: number;
}

interface PomodoroLogsProps {
  compact?: boolean;
}

export default function PomodoroLogs({ compact = false }: PomodoroLogsProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load logs from localStorage
    const savedLogs = localStorage.getItem('pomodoroLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    return `${minutes} min`;
  };

  const displayLogs = compact && !isExpanded ? logs.slice(0, 3) : logs;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Session History
        </h3>
        {compact && logs.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show More
              </>
            )}
          </Button>
        )}
      </div>

      {logs.length > 0 ? (
        <div className={`${compact ? 'max-h-[300px]' : ''} overflow-auto`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{formatTime(log.startTime)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      log.type === 'work'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                        : log.type === 'shortBreak'
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {log.type.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatDuration(log.duration)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No sessions completed yet
        </div>
      )}
    </div>
  );
} 