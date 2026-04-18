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

export function useSupabaseSync() {
  const [tasks, setTasks] = useState<SyncedTasks>({ yuvali: new Set(), maayani: new Set(), palgi: new Set() });
  const [stars, setStars] = useState<SyncedStars>({ yuvali: 0, maayani: 0, palgi: 0 });
  const [loading, setLoading] = useState(true);

  // Initialize and load
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch tasks
      const { data: tasksData } = await supabase.from('tasks').select('*');
      const newTasks: SyncedTasks = { yuvali: new Set(), maayani: new Set(), palgi: new Set() };
      if (tasksData) {
        tasksData.forEach((row: any) => {
          if (row.is_completed && newTasks[row.child_name]) {
            newTasks[row.child_name].add(row.task_name);
          }
        });
      }
      setTasks(newTasks);

      // Fetch stars
      const { data: starsData } = await supabase.from('stars').select('*');
      const newStars: SyncedStars = { yuvali: 0, maayani: 0, palgi: 0 };
      if (starsData) {
        starsData.forEach((row: any) => {
          if (newStars[row.child_name] !== undefined) {
            newStars[row.child_name] = row.star_count;
          }
        });
      }
      setStars(newStars);
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
