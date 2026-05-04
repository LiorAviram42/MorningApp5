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

const isToday = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
};

const loadCachedTasks = (): SyncedTasks => {
  try {
    const cachedDate = localStorage.getItem('cachedTasksDate');
    const cached = localStorage.getItem('cachedTasks');
    if (cached && cachedDate && isToday(cachedDate)) {
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
    localStorage.setItem('cachedTasksDate', new Date().toISOString());
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
        // Sort by id descending so newest task row is processed first for dupe safety
        tasksData.sort((a: any, b: any) => b.id - a.id);
        
        const processed = new Set<string>();
        tasksData.forEach((row: any) => {
          const key = row.child_name + '_' + row.task_name;
          if (processed.has(key)) return;
          processed.add(key);

          // Only add to completed if it's from today
          if (row.is_completed && newTasks[row.child_name] && isToday(row.updated_at)) {
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
        setTasks((prevTasks) => {
           // Wait, we should only set stars here. Avoid overriding tasks.
           return prevTasks;
        });
        setStars(newStars);
      }
      
      setLoading(false);
    };

    fetchInitialData();

    // Subscribe to tasks and stars
    const realtimeChannel = supabase
      .channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        const row = payload.new as any;
        if (!row || !row.child_name || !row.task_name) return;
        
        setTasks((prev) => {
          const newSet = new Set(prev[row.child_name]);
          if (row.is_completed && isToday(row.updated_at)) {
            newSet.add(row.task_name);
          } else {
            newSet.delete(row.task_name);
          }
          return { ...prev, [row.child_name]: newSet };
        });
      })
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
      supabase.removeChannel(realtimeChannel);
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

    const currentDate = new Date().toISOString();
    
    // Explicit Update or Insert instead of Upsert to prevent dupes without constraint
    const { data } = await supabase
      .from('tasks')
      .select('id')
      .eq('child_name', kidId)
      .eq('task_name', taskId)
      .order('id', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      await supabase.from('tasks').update({ 
        is_completed: isCompletedNow, 
        updated_at: currentDate 
      }).eq('id', data[0].id);
    } else {
      await supabase.from('tasks').insert({ 
        child_name: kidId, 
        task_name: taskId, 
        is_completed: isCompletedNow, 
        updated_at: currentDate 
      });
    }
  };

  const updateStar = async (kidId: KidId, newCount: number) => {
    setStars((prev) => ({ ...prev, [kidId]: newCount }));
    const { data } = await supabase.from('stars').select('child_name').eq('child_name', kidId);
    if (data && data.length > 0) {
      await supabase.from('stars').update({ star_count: newCount }).eq('child_name', kidId);
    } else {
      await supabase.from('stars').insert({ child_name: kidId, star_count: newCount });
    }
  };

  const resetKidTasks = async (kidId: KidId, specificTasksToReset?: string[]) => {
    setTasks((prev) => {
      const existingTasks = Array.from(prev[kidId] || []);
      const newTasks = existingTasks.filter(t => specificTasksToReset ? !specificTasksToReset.includes(t) : false);
      return { ...prev, [kidId]: new Set(newTasks) };
    });

    const tasksToReset = specificTasksToReset || getTasksForKid(kidId, 'day').map(t => `day_${t.id}`).concat(getTasksForKid(kidId, 'night').map(t => `night_${t.id}`));
    const currentDate = new Date().toISOString();
    
    // Need to update each explicitly to prevent dupes
    for (const t of tasksToReset) {
      const { data } = await supabase
        .from('tasks')
        .select('id')
        .eq('child_name', kidId)
        .eq('task_name', t)
        .order('id', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        await supabase.from('tasks').update({ is_completed: false, updated_at: currentDate }).eq('id', data[0].id);
      } else {
        await supabase.from('tasks').insert({ child_name: kidId, task_name: t, is_completed: false, updated_at: currentDate });
      }
    }
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
