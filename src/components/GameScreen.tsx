import React, { useState, useEffect } from "react";
import { KidId, Task } from "../types";
import { getKids, getTasksForKid } from "../constants";
import { motion, useAnimation, AnimatePresence } from "motion/react";
import { sounds, safeVibrate } from "../utils/sounds";
import { Plus, Minus } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useTheme } from "../contexts/ThemeContext";

export type LayerConfig = {
  taskId: string;
  layerName: string;
  blendMode?: React.CSSProperties["mixBlendMode"];
  exactFileName?: string;
  hideWhenOff?: boolean;
  hideWhenOn?: boolean;
};

const CHARACTER_LAYERS: Record<string, LayerConfig[]> = {
  day_yuvali: [
    { taskId: "clothes", layerName: "Cloths" },
    {
      taskId: "hair",
      layerName: "Hair_Shadow",
      blendMode: "multiply",
      exactFileName: "Hair_Shadow.png",
      hideWhenOff: true,
    },
    { taskId: "hair", layerName: "Hair" },
    { taskId: "shoes", layerName: "Shoes" },
    { taskId: "face", layerName: "Eyes" },
    { taskId: "teeth", layerName: "Mouth" },
  ],
  day_maayani: [
    { taskId: "clothes", layerName: "Cloths" },
    { taskId: "shoes", layerName: "Shoes" },
    { taskId: "face", layerName: "Face" },
    { taskId: "teeth", layerName: "Teeth" },
  ],
  day_pelegi: [
    { taskId: "hair", layerName: "Hair" },
    { taskId: "clothes", layerName: "Cloths" },
    { taskId: "shoes", layerName: "Shoes" },
    { taskId: "face", layerName: "Eyes" },
    { taskId: "teeth", layerName: "Mouth" },
  ],
  night_yuvali: [
    {
      taskId: "hair",
      layerName: "Hair_Off_Shadow",
      blendMode: "multiply",
      exactFileName: "Hair_Off_Shadow.png",
      hideWhenOn: true,
    },
    { taskId: "hair", layerName: "Hair" },
    { taskId: "pj", layerName: "PJ" },
    { taskId: "shower", layerName: "Shower", hideWhenOn: true },
    { taskId: "face", layerName: "Face", hideWhenOn: true },
    { taskId: "teeth", layerName: "Teeth" },
  ],
  night_maayani: [
    { taskId: "pj", layerName: "PJ" },
    { taskId: "shower", layerName: "Shower", hideWhenOn: true },
    { taskId: "face", layerName: "Face" },
    { taskId: "teeth", layerName: "Teeth" },
  ],
  night_pelegi: [
    { taskId: "hair", layerName: "Hair" },
    { taskId: "pj", layerName: "PJ" },
    { taskId: "shower", layerName: "Shower", hideWhenOn: true },
    { taskId: "face", layerName: "Face", hideWhenOn: true },
    { taskId: "teeth", layerName: "Teeth" },
  ],
};

const SPARKLES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  left: 20 + Math.random() * 60, // 20% to 80% (centered over character width)
  top: 48 + Math.random() * 27, // 48% to 75% (moved lower to avoid the face)
  size: 10 + Math.random() * 15, // 10px to 25px
  delay: Math.random() * 4, // 0s to 4s delay for a longer loop stagger
}));

interface Props {
  kidId: KidId;
  onBack: () => void;
}

export default function GameScreen({ kidId, onBack }: Props) {
  const {
    role,
    tasks: globalTasks,
    stars: globalStars,
    toggleTask: toggleGlobalTask,
    updateStar,
    resetKidTasks,
  } = useUser();
  const { theme } = useTheme();

  const kidsConfig = getKids(theme);
  const kid = kidsConfig[kidId];
  const allKidTasks = getTasksForKid(kidId, theme);
  const leftTasks = allKidTasks.filter((t) => t.side === "left");
  const rightTasks = allKidTasks.filter((t) => t.side === "right");

  const completedTasks = globalTasks[kidId] || new Set();
  const starsCount = globalStars[kidId] || 0;

  const [isReady, setIsReady] = useState(false);
  const [showStarAnimation, setShowStarAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 350);
    return () => clearTimeout(timer);
  }, [kidId]);

  const themeCompletedTasks = new Set(
    Array.from(completedTasks)
      .filter((t) => t.startsWith(`${theme}_`))
      .map((t) => t.replace(`${theme}_`, "")),
  );

  const toggleTask = async (rawTaskId: string) => {
    const taskId = `${theme}_${rawTaskId}`;
    safeVibrate(5);
    sounds.playClick();

    const isCurrentlyCompleted = themeCompletedTasks.has(rawTaskId);
    const willBeCompleted = !isCurrentlyCompleted;
    const isCompletingLastTask =
      willBeCompleted && themeCompletedTasks.size + 1 === allKidTasks.length;

    if (isCompletingLastTask) {
      sounds.playSuccess();
    }

    await toggleGlobalTask(kidId, taskId, willBeCompleted);

    // Auto-award star logic when completing the last task for current theme
    if (isCompletingLastTask) {
      const today = new Date().toDateString();
      const lastAwarded = localStorage.getItem(
        `lastStarDate_${theme}_${kidId}`,
      );
      if (lastAwarded !== today) {
        const newCount = starsCount + 1;
        localStorage.setItem(`lastStarDate_${theme}_${kidId}`, today);
        setShowStarAnimation(true);
        setTimeout(() => setShowStarAnimation(false), 1600);
        await updateStar(kidId, newCount);
      }
    }
  };

  const progressPct =
    allKidTasks.length > 0
      ? (themeCompletedTasks.size / allKidTasks.length) * 100
      : 0;
  const isAllCompleted =
    themeCompletedTasks.size === allKidTasks.length && allKidTasks.length > 0;

  const handleUpdateStars = async (delta: number) => {
    safeVibrate(5);
    sounds.playClick();
    const newCount = Math.max(0, starsCount + delta);

    if (delta > 0) {
      setShowStarAnimation(true);
      setTimeout(() => setShowStarAnimation(false), 1600);
    }

    await updateStar(kidId, newCount);
  };

  const kidLayers = CHARACTER_LAYERS[`${theme}_${kidId}`] || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full w-full absolute inset-0 pt-[15px] px-[15px] pb-[max(15px,env(safe-area-inset-bottom))] box-border overflow-hidden z-20"
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#333 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <motion.div
        initial={{
          y: 15,
          scale: 0.9,
          opacity: 0,
          boxShadow: "0px 0px 0px #333",
        }}
        animate={{ y: 0, scale: 1, opacity: 1, boxShadow: "0px 8px 0px #333" }}
        exit={{ scale: 0.1, y: 50, opacity: 0 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 15 }}
        className={`flex flex-col flex-1 w-full min-h-0 backdrop-blur-sm rounded-3xl border border-[#333] p-2.5 box-border relative overflow-y-auto overflow-x-hidden z-10 ${
          theme === "night"
            ? "bg-[#cdd1e4]/85 text-[#222]"
            : "bg-white/75 text-[#333]"
        }`}
      >
        <div className="grid grid-cols-[clamp(70px,24vw,110px)_1fr_clamp(70px,24vw,110px)] items-center w-full pt-2 pb-4 border-b border-[#333]/10 shrink-0">
          <div className="flex justify-center w-full px-2">
            <h3
              className={`m-0 text-xl font-bold transition-colors duration-200 ${theme === "night" ? "text-[#1a1525]" : "text-[#333]"}`}
              style={{ transitionDelay: theme === "night" ? "0ms" : "200ms" }}
            >
              {kid.name}
            </h3>
          </div>

          <div className="flex items-center justify-center min-w-0 px-1">
            <div className="flex items-center gap-1 bg-black/5 backdrop-blur-[2px] px-3 py-1 rounded-full border border-black/5 min-h-[32px]">
              {starsCount > 0 ? (
                <div className="flex items-center gap-0.5">
                  {starsCount <= 5 ? (
                    Array.from({ length: starsCount }).map((_, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        className="w-5 h-5 shrink-0"
                      >
                        <path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          fill="#ffbc00"
                          stroke="#000"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                    ))
                  ) : (
                    <div className="flex items-center gap-1 text-[#333]">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                        <path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          fill="#ffbc00"
                          stroke="#000"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-sm font-black mt-[1px]">×</span>
                      <span className="text-sm font-black">{starsCount}</span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[10px] font-bold text-[#333]/30 whitespace-nowrap">
                  אין כוכבים עדיין
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center w-full px-2">
            <motion.button
              initial={{ y: 4, boxShadow: "0px 0px 0px #333" }}
              animate={
                isReady
                  ? { y: 0, boxShadow: "0px 4px 0px #333" }
                  : { y: 4, boxShadow: "0px 0px 0px #333" }
              }
              whileTap={{ y: 4, boxShadow: "0px 0px 0px #333" }}
              transition={{
                type: "spring" as const,
                stiffness: 800,
                damping: 15,
              }}
              className={`border border-[#333] p-1.5 rounded-2xl cursor-pointer flex items-center justify-center w-10 h-10 ${
                theme === "night" ? "bg-[#76639c]" : "bg-[#fde4cf]"
              }`}
              onClick={() => {
                safeVibrate(5);
                sounds.playBack();
                onBack();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path
                  d="M3 9 L12 2 L21 9 V20 A2 2 0 0 1 19 22 H15 V12 H9 V22 H5 A2 2 0 0 1 3 20 Z"
                  fill={theme === "night" ? "#9d8ac7" : "#f9b88a"}
                  stroke={theme === "night" ? "#FFFFFF" : "#333"}
                />
              </svg>
            </motion.button>
          </div>
        </div>

        <div className="flex-1 flex flex-col w-full my-0 min-h-0 gap-2 sm:gap-3 lg:gap-4">
          <div className="flex-1 grid grid-cols-[clamp(70px,24vw,110px)_1fr_clamp(70px,24vw,110px)] items-stretch justify-items-center w-full min-h-0 relative">
            {/* Right Tasks */}
            <div className="flex flex-col justify-start gap-[clamp(2px,min(1.5vh,1.5vw),16px)] h-full w-full items-center z-10 py-1 min-h-0 relative mt-2">
              {rightTasks.map((t) => (
                <TaskButton
                  key={t.id}
                  task={t}
                  isCompleted={themeCompletedTasks.has(t.id)}
                  isReady={isReady}
                  onClick={() => toggleTask(t.id)}
                />
              ))}
            </div>

            {/* Character */}
            <div className="flex flex-col justify-center items-center h-full w-full min-h-0 z-0 pointer-events-none relative scale-[1.4] sm:scale-[1.5] origin-center">
              {kidLayers.map(
                (
                  {
                    taskId,
                    layerName,
                    blendMode,
                    exactFileName,
                    hideWhenOff,
                    hideWhenOn,
                  },
                  index,
                ) => {
                  const isTaskCompleted = themeCompletedTasks.has(taskId);
                  const layerState = isTaskCompleted ? "On" : "Off";
                  const getFolderName = (
                    themeMode: string,
                    kidMode: string,
                  ) => {
                    if (themeMode === "day") {
                      if (kidMode === "maayani") return "Maayani_Separated";
                      if (kidMode === "yuvali") return "Yuvali_Separated";
                      if (kidMode === "pelegi") return "Pelegi_Separated";
                    } else if (themeMode === "night") {
                      if (kidMode === "pelegi") return "Pelegi";
                      return kidMode;
                    }
                    return kidMode;
                  };

                  const folderName = getFolderName(theme, kidId);
                  const imgSrc = exactFileName
                    ? `/${theme}/summer/${folderName}/${exactFileName}`
                    : `/${theme}/summer/${folderName}/${layerName}_${layerState}.png`;

                  if (hideWhenOff && !isTaskCompleted) {
                    return null;
                  }

                  if (hideWhenOn && isTaskCompleted) {
                    return null;
                  }

                  return (
                    <img
                      key={layerName}
                      src={imgSrc}
                      alt={`${layerName} ${layerState}`}
                      className={`w-full h-full object-contain transition-opacity duration-300 pointer-events-none ${index === 0 ? "relative z-0" : "absolute inset-0 z-10"}`}
                      style={blendMode ? { mixBlendMode: blendMode } : {}}
                    />
                  );
                },
              )}

              {/* Completion Sparkles */}
              {isAllCompleted &&
                SPARKLES.map((sparkle) => (
                  <motion.div
                    key={sparkle.id}
                    animate={{
                      opacity: [0, 1, 1, 0, 0],
                      y: [0, -5, -10, -15, -15],
                      scale: [0, 1, 1, 0.5, 0],
                    }}
                    transition={{
                      type: "keyframes",
                      duration: 4,
                      delay: sparkle.delay,
                      repeat: Infinity,
                      times: [0, 0.05, 0.15, 0.25, 1], // Stays at full opacity for 400ms so it registers as solid white
                      ease: "easeInOut",
                    }}
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: `${sparkle.left}%`,
                      top: `${sparkle.top}%`,
                      width: sparkle.size,
                      height: sparkle.size,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="#FFFFFF"
                      className="w-full h-full"
                    >
                      <path d="M12 0C12 6.6 17.4 12 24 12C17.4 12 12 17.4 12 24C12 17.4 6.6 12 0 12C6.6 12 12 6.6 12 0Z" />
                    </svg>
                  </motion.div>
                ))}
            </div>

            {/* Left Tasks */}
            <div className="flex flex-col justify-start gap-[clamp(2px,min(1.5vh,1.5vw),16px)] h-full w-full items-center z-10 py-1 min-h-0 relative mt-2">
              {leftTasks.map((t) => (
                <TaskButton
                  key={t.id}
                  task={t}
                  isCompleted={themeCompletedTasks.has(t.id)}
                  isReady={isReady}
                  onClick={() => toggleTask(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-[clamp(54px,8.5vh,82px)] bg-white/90 rounded-full shrink-0 relative box-border border-2 border-[#333] p-[6px]">
            <div className="w-full h-full rounded-full overflow-hidden bg-white/75">
              <div
                className="h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                style={{
                  width: `${progressPct}%`,
                  backgroundImage: kid.gradient,
                }}
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex flex-col items-center shrink-0 mt-4 mb-1 relative">
          <div className="flex items-center gap-4">
            {role === "parent" && (
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
                themeCompletedTasks.size > 0
                  ? { y: 0, boxShadow: "0px 4px 0px #333" }
                  : { y: 4, boxShadow: "0px 0px 0px #333" }
              }
              whileTap={
                themeCompletedTasks.size > 0
                  ? { y: 4, boxShadow: "0px 0px 0px #333" }
                  : {}
              }
              transition={{
                type: "spring" as const,
                stiffness: 800,
                damping: 15,
              }}
              className={`py-2 px-6 rounded-2xl font-bold text-sm border ${
                themeCompletedTasks.size > 0
                  ? "bg-[#bae1ff] text-[#333] border-[#333] cursor-pointer"
                  : "bg-[#fcf9f2] text-[#333]/40 border-[#333]/40 cursor-default"
              }`}
              onClick={async () => {
                if (themeCompletedTasks.size === 0) return;
                safeVibrate(5);
                sounds.playReset();

                // Only reset the tasks for the current theme
                const remainingTasks = Array.from(completedTasks).filter(
                  (t) => !t.startsWith(`${theme}_`),
                );
                const resetTasks = Array.from(completedTasks).filter((t) =>
                  t.startsWith(`${theme}_`),
                );

                if (resetTasks.length > 0) {
                  await resetKidTasks(kidId, resetTasks);
                }
              }}
            >
              {kidId === "yuvali" ? "התחילי מחדש" : "התחל מחדש"}
            </motion.button>

            {role === "parent" && (
              <button
                onClick={() => handleUpdateStars(1)}
                className="w-8 h-8 rounded-full bg-white border border-[#333] flex items-center justify-center shadow-[0_3px_0_#333] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <Plus size={18} />
              </button>
            )}
          </div>

          <div className="min-h-[40px] mt-3 flex items-center justify-center shrink-0">
            {starsCount > 0 && role === "parent" && (
              <button
                className="text-[10px] text-[#333]/30 underline bg-transparent border-none cursor-pointer p-0.5"
                onClick={async () => {
                  safeVibrate(5);
                  localStorage.removeItem(`lastStarDate_${theme}_${kidId}`);
                  await updateStar(kidId, 0);
                }}
              >
                איפוס כוכבים
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showStarAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className={`relative flex items-center justify-center ${
                kidId === "pelegi"
                  ? "-translate-y-4 sm:-translate-y-8"
                  : "-translate-y-20 sm:-translate-y-24"
              }`}
            >
              {/* Sparkles */}
              {Array.from({ length: 15 }).map((_, i) => {
                const angle = Math.random() * Math.PI * 2;
                const distance = 80 + Math.random() * 120;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, Math.random() * 0.6 + 0.4, 0],
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      rotate: Math.random() * 180 - 90,
                    }}
                    transition={{
                      type: "keyframes",
                      duration: 0.5 + Math.random() * 0.2,
                      ease: "easeOut",
                      delay: 0.9 + Math.random() * 0.1,
                    }}
                    className="absolute w-8 h-8 text-[#ffea92]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-full h-full drop-shadow-md"
                    >
                      <path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill="#ffea92"
                      />
                    </svg>
                  </motion.div>
                );
              })}

              {/* Main Star */}
              <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -45 }}
                animate={{
                  scale: [0, 1.3, 1, 1, 2.5],
                  opacity: [0, 1, 1, 1, 0],
                  rotate: [-45, 0, 0, 0, 0],
                  filter: [
                    "drop-shadow(0px 0px 0px rgba(255, 234, 146, 0))",
                    "drop-shadow(0px 0px 0px rgba(255, 234, 146, 0))",
                    "drop-shadow(0px 0px 80px rgba(255, 234, 146, 1)) drop-shadow(0px 0px 40px rgba(255, 255, 255, 0.8))",
                    "drop-shadow(0px 0px 20px rgba(255, 234, 146, 0.5)) drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.3))",
                    "drop-shadow(0px 0px 0px rgba(255, 234, 146, 0))",
                  ],
                }}
                transition={{
                  type: "keyframes",
                  duration: 1.3,
                  times: [0, 0.08, 0.15, 0.6, 1],
                  ease: "easeInOut",
                }}
                className="absolute w-40 h-40"
              >
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="#ffea92"
                  />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
      transition: { type: "spring" as const, stiffness: 1000, damping: 20 },
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
        delay: 0.002, // 2ms delay as requested
      },
    });

    onClick();
  };

  return (
    <div className="flex flex-col items-center justify-start w-full">
      <motion.button
        animate={controls}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setIsPressed(false);
          controls.start({ y: 0, boxShadow: "0px 4px 0px #333" });
        }}
        className={`w-[clamp(38px,min(15vw,10.5vh),75px)] h-[clamp(38px,min(15vw,10.5vh),75px)] rounded-full border border-[#333] ${isCompleted ? "bg-white" : "bg-[#fcf9f2]"} flex items-center justify-center p-[clamp(3px,1vw,5px)] touch-none shrink-0`}
      >
        <img
          src={isCompleted ? task.iconOn : task.iconOff}
          alt={task.title}
          className="w-full h-full object-contain pointer-events-none transition-all duration-300"
          style={
            !isCompleted && task.id !== "sunscreen" && task.id !== "dinner"
              ? {
                  filter:
                    "grayscale(100%) sepia(20%) hue-rotate(350deg) brightness(115%) contrast(120%) opacity(0.7)",
                }
              : {}
          }
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${task.title}&background=random&color=fff&rounded=true&size=128`;
          }}
        />
      </motion.button>
      <div className="h-[36px] flex items-center justify-center mt-[2px] w-full shrink-0">
        <span className="block text-[clamp(10px,min(2.5vw,2vh),14px)] font-bold text-[#333] text-center leading-tight whitespace-pre-line px-1">
          {task.title}
        </span>
      </div>
    </div>
  );
}
