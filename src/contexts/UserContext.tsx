import React, { createContext, useContext, useState, useEffect } from 'react';
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
  resetKidTasks: (kidId: KidId) => Promise<void>;
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

  useEffect(() => {
    const saved = localStorage.getItem('role') as 'parent' | 'child' | null;
    if (saved) {
      setRoleState(saved);
    }
  }, []);

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
    <AppContext.Provider value={{ role, setRole, ...syncProps }}>
      {children}
    </AppContext.Provider>
  );
};
