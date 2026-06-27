import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PinScreen from '../components/PinScreen';
import { useSupabaseSync, SyncedTasks, SyncedStars } from '../hooks/useSupabaseSync';
import { KidId } from '../types';

export interface CustomTaskDef {
  id: string;
  title: string;
  iconName: string;
  theme: 'day' | 'night';
}

export type KidSettings = {
  hiddenTasks: string[];
  customTasks: CustomTaskDef[];
};

export type SettingsMap = Record<KidId, KidSettings>;

interface AppContextType {
  role: 'parent' | 'child' | null;
  setRole: (role: 'parent' | 'child' | null) => void;
  tasks: SyncedTasks;
  stars: SyncedStars;
  loading: boolean;
  toggleTask: (kidId: KidId, taskId: string, isCompletedNow: boolean) => Promise<void>;
  updateStar: (kidId: KidId, newCount: number) => Promise<void>;
  resetKidTasks: (kidId: KidId, specificTasksToReset?: string[]) => Promise<void>;
  timerState: { isRunning: boolean; isPaused: boolean; timeLeft: number; totalTime: number; endTime: number | null; inputH: string; inputM: string; inputS: string; };
  setTimerState: React.Dispatch<React.SetStateAction<{ isRunning: boolean; isPaused: boolean; timeLeft: number; totalTime: number; endTime: number | null; inputH: string; inputM: string; inputS: string; }>>;
  cancelTimer: () => void;
  togglePause: () => void;
  settings: SettingsMap;
  updateSettings: (kidId: KidId, newSettings: KidSettings) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useUser = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};

const defaultSettings: SettingsMap = {
  yuvali: { hiddenTasks: [], customTasks: [] },
  maayani: { hiddenTasks: [], customTasks: [] },
  pelegi: { hiddenTasks: [], customTasks: [] },
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<'parent' | 'child' | null>(null);
  const syncProps = useSupabaseSync();
  const [settings, setSettingsState] = useState<SettingsMap>(defaultSettings);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('role') as 'parent' | 'child' | null;
    if (savedRole) setRoleState(savedRole);

    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        setSettingsState(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  useEffect(() => {
    if (syncProps.syncedSettings) {
      setSettingsState(syncProps.syncedSettings);
      localStorage.setItem('app_settings', JSON.stringify(syncProps.syncedSettings));
    }
  }, [syncProps.syncedSettings]);

  const updateSettingsSyncRef = React.useRef(syncProps.updateSettingsSync);
  useEffect(() => {
    updateSettingsSyncRef.current = syncProps.updateSettingsSync;
  }, [syncProps.updateSettingsSync]);

  const updateSettings = useCallback((kidId: KidId, newSettings: KidSettings) => {
    setSettingsState(prev => {
      const next = { ...(prev || defaultSettings), [kidId]: newSettings };
      localStorage.setItem('app_settings', JSON.stringify(next));
      if (updateSettingsSyncRef.current) {
         updateSettingsSyncRef.current(next);
      }
      return next;
    });
  }, []);

  const [timerState, setTimerState] = useState({
    isRunning: false,
    isPaused: false,
    timeLeft: 0,
    totalTime: 0,
    endTime: null as number | null,
    inputH: '0',
    inputM: '0',
    inputS: '0',
  });

  const cancelTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false, isPaused: false, timeLeft: 0, totalTime: 0, endTime: null }));
  }, []);

  const togglePause = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isRunning) return prev;
      if (prev.isPaused) {
        // Unpausing
        const now = Date.now();
        return { ...prev, isPaused: false, endTime: now + prev.timeLeft * 1000 };
      } else {
        // Pausing
        return { ...prev, isPaused: true, endTime: null };
      }
    });
  }, []);

  // Timer Background Interval
  useEffect(() => {
    let interval: any;
    if (timerState.isRunning && !timerState.isPaused && timerState.endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((timerState.endTime! - now) / 1000));
        
        setTimerState(prev => {
          if (remaining <= 0) {
            return { ...prev, isRunning: false, isPaused: false, timeLeft: 0, endTime: null };
          }
          return { ...prev, timeLeft: remaining };
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.isPaused, timerState.endTime]);

  const setRole = (newRole: 'parent' | 'child' | null) => {
    if (newRole) {
      localStorage.setItem('role', newRole);
    } else {
      localStorage.removeItem('role');
    }
    setRoleState(newRole);
  };

  if (role === null) {
    return <PinScreen onLogin={setRole} />;
  }

  return (
    <AppContext.Provider value={{ role, setRole, ...syncProps, timerState, setTimerState, cancelTimer, togglePause, settings, updateSettings, isMenuOpen, setIsMenuOpen }}>
      {children}
    </AppContext.Provider>
  );
};
