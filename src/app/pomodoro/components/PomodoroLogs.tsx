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
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Log {
  session_id: string;
  type: string;
  start_time: string;
  duration: number;
  note: string;
}

interface PomodoroLogsProps {
  compact?: boolean;
}

export default function PomodoroLogs({ compact = false }: PomodoroLogsProps) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pomodoro/sessions');
      const data = await response.json();
      
      if (data.sessions) {
        // Sort sessions by start_time in descending order (newest first)
        const sortedSessions = data.sessions.sort((a: Log, b: Log) => 
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );
        setLogs(sortedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDuration = (minutes: number) => {
    return `${minutes} min`;
  };

  const formatType = (type: string) => {
    // Remove _paused or _reset suffix if present
    const baseType = type.replace(/_paused|_reset/g, '');
    
    // Convert camelCase to Title Case
    return baseType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getTypeStyle = (type: string) => {
    if (type.includes('work')) {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300';
    } else if (type.includes('shortBreak')) {
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300';
    } else {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    }
  };

  const getStatusIndicator = (type: string) => {
    if (type.includes('_paused')) {
      return '⏸️';
    } else if (type.includes('_reset')) {
      return '⏹️';
    } else {
      return '✅';
    }
  };

  const displayLogs = compact && !isExpanded ? logs.slice(0, 3) : logs;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-300">
          Session History
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchLogs}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {compact && logs.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-300"
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
      </div>

      {logs.length > 0 ? (
        <div className={`${compact ? 'max-h-[300px]' : ''} overflow-auto`}>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-right text-slate-400">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayLogs.map((log) => (
                <TableRow key={log.session_id} className="border-slate-700">
                  <TableCell className="font-medium text-slate-400">
                    {formatDate(log.start_time)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-400">
                    {formatTime(log.start_time)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getTypeStyle(log.type)}`}>
                        {formatType(log.type)}
                      </span>
                      <span title={log.type.includes('_paused') ? 'Paused' : log.type.includes('_reset') ? 'Reset' : 'Completed'}>
                        {getStatusIndicator(log.type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-400">
                    {formatDuration(log.duration)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4 text-slate-400">
          {isLoading ? 'Loading sessions...' : 'No sessions completed yet'}
        </div>
      )}
    </div>
  );
} 