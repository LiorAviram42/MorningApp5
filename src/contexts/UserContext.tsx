import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PinScreen from '../components/PinScreen';
import { useSupabaseSync, SyncedTasks, SyncedStars } from '../hooks/useSupabaseSync';
import { KidId } from '../types';

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
}

const AppContext = createContext<AppContextType | null>(null);

export const useUser = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<'parent' | 'child' | null>(null);
  const syncProps = useSupabaseSync();

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

  useEffect(() => {
    const saved = localStorage.getItem('role') as 'parent' | 'child' | null;
    if (saved) {
      setRoleState(saved);
    }
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
    <AppContext.Provider value={{ role, setRole, ...syncProps, timerState, setTimerState, cancelTimer, togglePause }}>
      {children}
    </AppContext.Provider>
  );
};
