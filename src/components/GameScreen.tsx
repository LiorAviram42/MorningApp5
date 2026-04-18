import React, { useState, useEffect } from 'react';
import { KidId, Task } from '../types';
import { KIDS, getTasksForKid } from '../constants';
import { motion, useAnimation } from 'motion/react';
import { sounds, safeVibrate } from '../utils/sounds';
import { Home, Plus, Minus } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

import charYuvaliBefore from '/character_yuvali_before.png';
import charYuvaliAfter from '/character_yuvali_after.png';
import charMaayaniBefore from '/character_maayani_before.png';
import charMaayaniAfter from '/character_maayani_after.png';
import charPalgiBefore from '/character_palgi_before.png';
import charPalgiAfter from '/character_palgi_after.png';

const CHARACTERS: Record<string, { before: string, after: string }> = {
  yuvali: { before: charYuvaliBefore, after: charYuvaliAfter },
  maayani: { before: charMaayaniBefore, after: charMaayaniAfter },
  palgi: { before: charPalgiBefore, after: charPalgiAfter }
};

interface Props {
  kidId: KidId;
  onBack: () => void;
}

export default function GameScreen({ kidId, onBack }: Props) {
  const { role, tasks: globalTasks, stars: globalStars, toggleTask: toggleGlobalTask, updateStar, resetKidTasks } = useUser();
  const kid = KIDS[kidId];
  const allKidTasks = getTasksForKid(kidId);
  const leftTasks = allKidTasks.filter(t => t.side === 'left');
  const rightTasks = allKidTasks.filter(t => t.side === 'right');

  const completedTasks = globalTasks[kidId] || new Set();
  const starsCount = globalStars[kidId] || 0;
  
  const [isReady, setIsReady] = useState(false);
  const [lastStarDate, setLastStarDate] = useState('');

  useEffect(() => {
    const savedDate = localStorage.getItem(`lastStarDate_${kidId}`);
    if (savedDate) {
      setLastStarDate(savedDate);
    }
  }, [kidId]);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 350);
    return () => clearTimeout(timer);
  }, [kidId]);

  const toggleTask = async (taskId: string) => {
    safeVibrate(5);
    sounds.playClick();

    const isCurrentlyCompleted = completedTasks.has(taskId);
    const willBeCompleted = !isCurrentlyCompleted;

    await toggleGlobalTask(kidId, taskId, willBeCompleted);

    // Auto-award star logic when completing the last task
    if (willBeCompleted && completedTasks.size + 1 === allKidTasks.length) {
      sounds.playSuccess();
      
      const today = new Date().toDateString();
      if (lastStarDate !== today) {
        const newCount = starsCount + 1;
        setLastStarDate(today);
        localStorage.setItem(`lastStarDate_${kidId}`, today);
        await updateStar(kidId, newCount);
      }
    }
  };

  const progressPct = allKidTasks.length > 0 ? (completedTasks.size / allKidTasks.length) * 100 : 0;
  const isAllCompleted = completedTasks.size === allKidTasks.length && allKidTasks.length > 0;

  const handleUpdateStars = async (delta: number) => {
    safeVibrate(5);
    sounds.playClick();
    const newCount = Math.max(0, starsCount + delta);
    await updateStar(kidId, newCount);
  };

  const characterImg = isAllCompleted ? CHARACTERS[kidId].after : CHARACTERS[kidId].before;

  return (
    <div className="flex flex-col h-full w-full p-[15px] box-border relative overflow-hidden safe-area-inset">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <motion.div 
        initial={{ y: 15, boxShadow: "0px 0px 0px #333" }}
        animate={{ y: 0, boxShadow: "0px 8px 0px #333" }}
        transition={{ type: "spring" as const, stiffness: 500, damping: 10 }}
        className="flex flex-col h-full w-full bg-white/75 backdrop-blur-sm rounded-3xl border border-[#333] p-2.5 box-border relative overflow-hidden z-10"
      >
        <div className="flex flex-row justify-between items-center w-full pt-2 pb-4 border-b border-[#333]/10 shrink-0">
          <h3 className="m-0 text-lg font-bold text-[#333] text-right min-w-[100px]">ההתארגנות של {kid.name}</h3>

          <div className="flex-1 flex items-center justify-center">
            {role === 'parent' && (
              <div className="flex items-center gap-1 bg-black/5 backdrop-blur-[2px] px-3 py-1 rounded-full border border-black/5 min-h-[32px]">
                {starsCount > 0 ? (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: Math.min(starsCount, 5) }).map((_, i) => (
                      <svg key={i} viewBox="0 0 24 24" className="w-5 h-5">
                        <path 
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                          fill="#ffbc00"
                          stroke="#000"
                          strokeWidth="1.2"
                        />
                      </svg>
                    ))}
                    {starsCount > 5 && <span className="text-xs font-black text-[#333] ml-0.5">+{starsCount - 5}</span>}
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-[#333]/30">אין כוכבים עדיין</span>
                )}
              </div>
            )}
          </div>

          <motion.button 
            initial={{ y: 4, boxShadow: "0px 0px 0px #333" }}
            animate={isReady ? { y: 0, boxShadow: "0px 4px 0px #333" } : { y: 4, boxShadow: "0px 0px 0px #333" }}
            whileTap={{ y: 4, boxShadow: "0px 0px 0px #333" }}
            transition={{ type: "spring" as const, stiffness: 800, damping: 15 }}
            className="bg-[#fde4cf] text-[#333] border border-[#333] p-2 rounded-2xl cursor-pointer flex items-center justify-center min-w-[40px]"
            onClick={() => {
              safeVibrate(5);
              sounds.playBack();
              onBack();
            }}
          >
            <Home size={24} stroke="#333" fill="#f9b88a" strokeWidth={1.5} />
          </motion.button>
        </div>

        <div className="flex-1 flex flex-col w-full my-0 min-h-0 pt-1 pb-1">
          {/* Main Grid Content Area - Scrollable but hides scrollbar */}
          <div className="flex-1 w-full min-h-0 relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="grid grid-cols-[1fr_minmax(120px,2fr)_1fr] h-full w-full items-center justify-items-center gap-1 sm:gap-2">
              
              {/* Right Tasks */}
              <div className="flex flex-col justify-evenly h-full w-full items-center py-1 min-h-[250px]">
                {rightTasks.map((t) => (
                  <TaskButton 
                    key={t.id} 
                    task={t} 
                    isCompleted={completedTasks.has(t.id)} 
                    isReady={isReady}
                    onClick={() => toggleTask(t.id)} 
                  />
                ))}
              </div>

              {/* Character */}
              <div className="flex flex-col justify-center items-center w-full h-full min-h-0">
                <img 
                  src={characterImg} 
                  alt="Character" 
                  className="max-w-full max-h-[140px] sm:max-h-[180px] md:max-h-[220px] object-contain transition-opacity duration-300 pointer-events-none drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${kid.name}${isAllCompleted ? 'happy' : 'sleepy'}`;
                  }}
                />
              </div>

              {/* Left Tasks */}
              <div className="flex flex-col justify-evenly h-full w-full items-center py-1 min-h-[250px]">
                {leftTasks.map((t) => (
                  <TaskButton 
                    key={t.id} 
                    task={t} 
                    isCompleted={completedTasks.has(t.id)} 
                    isReady={isReady}
                    onClick={() => toggleTask(t.id)} 
                  />
                ))}
              </div>

            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="w-full h-[36px] sm:h-[48px] md:h-[56px] bg-white rounded-full shrink-0 relative box-border border-2 border-[#333] p-1 shadow-[0_2px_0_#333] mt-2 mb-1"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              <div 
                className="h-full rounded-full transition-all duration-600 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                style={{ 
                  width: `${progressPct}%`, 
                  backgroundImage: kid.gradient 
                }}
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex flex-col items-center shrink-0 mt-4 mb-1 relative">
          <div className="flex items-center gap-4">
            {role === 'parent' && (
              <button 
                onClick={() => handleUpdateStars(-1)}
                className="w-8 h-8 rounded-full bg-white border border-[#333] flex items-center justify-center shadow-[0_3px_0_#333] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <Minus size={18} />
              </button>
            )}

            <motion.button 
              initial={{ y: 4, boxShadow: "0px 0px 0px #333" }}
              animate={
                completedTasks.size > 0 
                  ? { y: 0, boxShadow: "0px 4px 0px #333" }
                  : { y: 4, boxShadow: "0px 0px 0px #333" }
              }
              whileTap={completedTasks.size > 0 ? { y: 4, boxShadow: "0px 0px 0px #333" } : {}}
              transition={{ type: "spring" as const, stiffness: 800, damping: 15 }}
              className={`py-2 px-6 rounded-2xl font-bold text-sm border ${
                completedTasks.size > 0 
                  ? 'bg-[#bae1ff] text-[#333] border-[#333] cursor-pointer' 
                  : 'bg-[#fcf9f2] text-[#333]/40 border-[#333]/40 cursor-default'
              }`}
              onClick={async () => {
                if (completedTasks.size === 0) return;
                safeVibrate(5);
                sounds.playReset();
                await resetKidTasks(kidId);
              }}
            >
              {kidId === 'yuvali' ? 'התחילי מחדש' : 'התחל מחדש'}
            </motion.button>

            {role === 'parent' && (
              <button 
                onClick={() => handleUpdateStars(1)}
                className="w-8 h-8 rounded-full bg-white border border-[#333] flex items-center justify-center shadow-[0_3px_0_#333] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          
          <div className="h-[20px] mt-3 flex items-center justify-center">
            {starsCount > 0 && role === 'parent' && (
              <button 
                className="text-[10px] text-[#333]/30 underline bg-transparent border-none cursor-pointer p-0.5"
                onClick={async () => {
                  safeVibrate(5);
                  setLastStarDate('');
                  localStorage.removeItem(`lastStarDate_${kidId}`);
                  await updateStar(kidId, 0);
                }}
              >
                איפוס כוכבים
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface TaskButtonProps {
  task: Task;
  isCompleted: boolean;
  isReady: boolean;
  onClick: () => void;
  key?: string;
}

function TaskButton({ task, isCompleted, isReady, onClick }: TaskButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    if (isReady) {
      controls.start({ y: 0, boxShadow: "0px 4px 0px #333" });
    } else {
      controls.start({ y: 4, boxShadow: "0px 0px 0px #333" });
    }
  }, [isReady, controls]);

  const handlePointerDown = () => {
    setIsPressed(true);
    controls.start({ 
      y: 4, 
      boxShadow: "0px 0px 0px #333",
      transition: { type: "spring" as const, stiffness: 1000, damping: 20 }
    });
  };

  const handlePointerUp = () => {
    if (!isPressed) return;
    setIsPressed(false);
    
    // The "pop back up" delay requested by user (1-2ms is negligible, but we can make the spring slower)
    controls.start({ 
      y: 0, 
      boxShadow: "0px 4px 0px #333",
      transition: { 
        type: "spring" as const, 
        stiffness: 400, // Lower stiffness = slower return
        damping: 20,
        delay: 0.002 // 2ms delay as requested
      }
    });
    
    onClick();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[85px] shrink-0">
      <motion.button 
        animate={controls}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setIsPressed(false);
          controls.start({ y: 0, boxShadow: "0px 4px 0px #333" });
        }}
        className={`w-[13vw] h-[13vw] min-w-[50px] min-h-[50px] max-w-[75px] max-h-[75px] rounded-full border border-[#333] ${isCompleted ? 'bg-white' : 'bg-[#fcf9f2]'} flex items-center justify-center p-0.5 touch-none shrink-0`}
      >
        <img 
          src={isCompleted ? task.iconOn : task.iconOff} 
          alt={task.title} 
          className="w-full h-full object-contain pointer-events-none transition-all duration-300"
          style={!isCompleted ? { filter: 'grayscale(100%) sepia(20%) hue-rotate(350deg) brightness(115%) contrast(120%) opacity(0.7)' } : {}}
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${task.title}&background=random&color=fff&rounded=true&size=128`;
          }}
        />
      </motion.button>
      <span className="block text-[10px] sm:text-[12px] font-bold text-[#333] mt-1 text-center leading-tight whitespace-pre-line px-1 h-[28px] flex items-center justify-center w-full">
        {task.title}
      </span>
    </div>
  );
}
