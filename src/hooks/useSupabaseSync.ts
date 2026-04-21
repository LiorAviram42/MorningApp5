import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { KidId } from '../types';
import { getTasksForKid } from '../constants';

export interface SyncedTasks {
  [kidId: string]: Set<string>;
}

export interface SyncedStars {
  [kidId: string]: number;
}

const loadCachedTasks = (): SyncedTasks => {
  try {
    const cached = localStorage.getItem('cachedTasks');
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        yuvali: new Set(parsed.yuvali || []),
        maayani: new Set(parsed.maayani || []),
        pelegi: new Set(parsed.pelegi || [])
      };
    }
  } catch (e) {
    console.error("Failed to load cached tasks", e);
  }
  return { yuvali: new Set(), maayani: new Set(), pelegi: new Set() };
};

const loadCachedStars = (): SyncedStars => {
  try {
    const cached = localStorage.getItem('cachedStars');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Failed to load cached stars", e);
  }
  return { yuvali: 0, maayani: 0, pelegi: 0 };
};

export function useSupabaseSync() {
  const [tasks, setTasks] = useState<SyncedTasks>(loadCachedTasks());
  const [stars, setStars] = useState<SyncedStars>(loadCachedStars());
  const [loading, setLoading] = useState(true);

  // Save to cache whenever tasks change
  useEffect(() => {
    const serializedTasks = {
      yuvali: Array.from(tasks.yuvali),
      maayani: Array.from(tasks.maayani),
      pelegi: Array.from(tasks.pelegi)
    };
    localStorage.setItem('cachedTasks', JSON.stringify(serializedTasks));
  }, [tasks]);

  // Save to cache whenever stars change
  useEffect(() => {
    localStorage.setItem('cachedStars', JSON.stringify(stars));
  }, [stars]);

  // Initialize and load
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch tasks safely
      const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
      if (!tasksError && tasksData) {
        const newTasks: SyncedTasks = { yuvali: new Set(), maayani: new Set(), pelegi: new Set() };
        tasksData.forEach((row: any) => {
          if (row.is_completed && newTasks[row.child_name]) {
            newTasks[row.child_name].add(row.task_name);
          }
        });
        setTasks(newTasks);
      }

      // Fetch stars safely
      const { data: starsData, error: starsError } = await supabase.from('stars').select('*');
      if (!starsError && starsData) {
        const newStars: SyncedStars = { yuvali: 0, maayani: 0, pelegi: 0 };
        starsData.forEach((row: any) => {
          if (newStars[row.child_name] !== undefined) {
            newStars[row.child_name] = row.star_count;
          }
        });
        setStars(newStars);
      }
      
      setLoading(false);
    };

    fetchInitialData();

    // Subscribe to tasks
    const tasksSub = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        const row = payload.new as any;
        if (!row || !row.child_name || !row.task_name) return;
        
        setTasks((prev) => {
          const newSet = new Set(prev[row.child_name]);
          if (row.is_completed) {
            newSet.add(row.task_name);
          } else {
            newSet.delete(row.task_name);
          }
          return { ...prev, [row.child_name]: newSet };
        });
      })
      .subscribe();

    // Subscribe to stars
    const starsSub = supabase
      .channel('public:stars')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stars' }, (payload) => {
        const row = payload.new as any;
        if (!row || !row.child_name || row.star_count === undefined) return;

        setStars((prev) => ({
          ...prev,
          [row.child_name]: row.star_count
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSub);
      supabase.removeChannel(starsSub);
    };
  }, []);

  const toggleTask = async (kidId: KidId, taskId: string, isCompletedNow: boolean) => {
    // Optimistically update
    setTasks((prev) => {
      const newSet = new Set(prev[kidId]);
      if (isCompletedNow) newSet.add(taskId);
      else newSet.delete(taskId);
      return { ...prev, [kidId]: newSet };
    });

    // We do an UPSERT
    await supabase.from('tasks').upsert({
      child_name: kidId,
      task_name: taskId,
      is_completed: isCompletedNow
    });
  };

  const updateStar = async (kidId: KidId, newCount: number) => {
    // Optimistically update
    setStars((prev) => ({ ...prev, [kidId]: newCount }));
    
    // Explicit Update or Insert
    const { data } = await supabase.from('stars').select('child_name').eq('child_name', kidId);
    
    if (data && data.length > 0) {
      await supabase.from('stars').update({ star_count: newCount }).eq('child_name', kidId);
    } else {
      await supabase.from('stars').insert({ child_name: kidId, star_count: newCount });
    }
  };

  const resetKidTasks = async (kidId: KidId) => {
    // Optimistically update
    setTasks((prev) => ({ ...prev, [kidId]: new Set() }));

    const kidTasks = getTasksForKid(kidId);
    const updates = kidTasks.map(t => ({
      child_name: kidId,
      task_name: t.id,
      is_completed: false
    }));
    
    await supabase.from('tasks').upsert(updates);
  };

  return {
    tasks,
    stars,
    loading,
    toggleTask,
    updateStar,
    resetKidTasks
  };
}
