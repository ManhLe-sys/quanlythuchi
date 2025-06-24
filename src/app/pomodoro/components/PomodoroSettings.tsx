'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface PomodoroSettingsProps {
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

export default function PomodoroSettings({
  settings,
  setSettings,
}: PomodoroSettingsProps) {
  const [tempSettings, setTempSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    setSettings(tempSettings);
    setIsDirty(false);
  };

  const handleReset = () => {
    const defaultSettings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      cyclesBeforeLongBreak: 4,
    };
    setTempSettings(defaultSettings);
    setSettings(defaultSettings);
    setIsDirty(false);
  };

  const handleChange = (field: keyof typeof settings, value: number) => {
    setTempSettings(prev => {
      const newSettings = { ...prev, [field]: value };
      setIsDirty(JSON.stringify(newSettings) !== JSON.stringify(settings));
      return newSettings;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        {isDirty && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-yellow-600 dark:text-yellow-400"
          >
            Unsaved changes
          </motion.span>
        )}
      </div>

      <div className="grid gap-6">
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Label htmlFor="workDuration" className="text-gray-700 dark:text-gray-300">
            Work Duration (minutes)
          </Label>
          <Input
            id="workDuration"
            type="number"
            min="1"
            value={tempSettings.workDuration}
            onChange={(e) => handleChange('workDuration', parseInt(e.target.value) || 1)}
            className="focus:ring-2 focus:ring-rose-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label htmlFor="shortBreakDuration" className="text-gray-700 dark:text-gray-300">
            Short Break Duration (minutes)
          </Label>
          <Input
            id="shortBreakDuration"
            type="number"
            min="1"
            value={tempSettings.shortBreakDuration}
            onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value) || 1)}
            className="focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label htmlFor="longBreakDuration" className="text-gray-700 dark:text-gray-300">
            Long Break Duration (minutes)
          </Label>
          <Input
            id="longBreakDuration"
            type="number"
            min="1"
            value={tempSettings.longBreakDuration}
            onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value) || 1)}
            className="focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Label htmlFor="cyclesBeforeLongBreak" className="text-gray-700 dark:text-gray-300">
            Cycles Before Long Break
          </Label>
          <Input
            id="cyclesBeforeLongBreak"
            type="number"
            min="1"
            value={tempSettings.cyclesBeforeLongBreak}
            onChange={(e) => handleChange('cyclesBeforeLongBreak', parseInt(e.target.value) || 1)}
            className="focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </motion.div>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button
          onClick={handleSave}
          disabled={!isDirty}
          className={`w-full ${isDirty ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600' : ''}`}
        >
          Save Settings
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Reset to Default
        </Button>
      </div>
    </div>
  );
} 