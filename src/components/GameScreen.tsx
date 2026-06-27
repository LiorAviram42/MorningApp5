import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { KidId, Task } from "../types";
import { getKids, getTasksForKid } from "../constants";
import {
  motion,
  useAnimation,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  useMotionValueEvent,
} from "motion/react";
import { sounds, safeVibrate } from "../utils/sounds";
import {
  Plus,
  Minus,
  Hourglass,
  Star,
  Play,
  Pause,
  X as XIcon,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from '../contexts/LanguageContext';
import { KidConfig } from "../types";
import DigitWheel from "./DigitWheel";
import { adjustColor, interpolateColor } from "../utils/colors";

function VisualTimer() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [flashEndParams, setFlashEndParams] = useState({ isFlashing: false });
  const {
    timerState,
    setTimerState,
    cancelTimer: globalCancelTimer,
    togglePause,
  } = useUser();
  const { isRunning, isPaused, timeLeft, totalTime, inputH, inputM, inputS } =
    timerState;

  const setInputH = (val: string) =>
    setTimerState((prev) => ({ ...prev, inputH: val }));
  const setInputM = (val: string) =>
    setTimerState((prev) => ({ ...prev, inputM: val }));
  const setInputS = (val: string) =>
    setTimerState((prev) => ({ ...prev, inputS: val }));

  const audioCtxRef = useRef<AudioContext | null>(null);

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let internalWakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          internalWakeLock = await navigator.wakeLock.request("screen");
          wakeLockRef.current = internalWakeLock;
        }
      } catch (err) {
        console.warn("Wake Lock request failed:", err);
      }
    };

    const releaseWakeLock = async () => {
      if (internalWakeLock) {
        await internalWakeLock.release().catch(() => {});
        internalWakeLock = null;
        wakeLockRef.current = null;
      }
    };

    if (isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isRunning]);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback(
    (freq = 600, duration = 150) => {
      try {
        const audioCtx = getAudioCtx();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = "sine";

        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(
          0,
          audioCtx.currentTime + duration / 1000,
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration / 1000);
      } catch (e) {}
    },
    [getAudioCtx],
  );

  const playFinishSound = useCallback(() => {
    try {
      const audioCtx = getAudioCtx();
      const playAlarmTone = (
        freq: number,
        startTime: number,
        duration: number,
        vol: number,
      ) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square"; // distinct alarm tone
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2500;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
      };

      const now = audioCtx.currentTime;
      // Play 3 groups of quick double-beeps
      for (let j = 0; j < 3; j++) {
        const timeOff = now + j * 0.8;
        playAlarmTone(600, timeOff, 0.12, 0.3);
        playAlarmTone(600, timeOff + 0.2, 0.12, 0.3);
      }
    } catch (e) {}
  }, [getAudioCtx]);

  // Audio side-effects for timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      if (timeLeft <= 10) {
        playBeep(800, 150);
      } else if (timeLeft % 30 === 0) {
        playBeep(600, 200);
      }
    } else if (isRunning === false && timeLeft === 0 && totalTime > 0) {
      playFinishSound();
      setFlashEndParams({ isFlashing: true });
      setTimeout(() => setFlashEndParams({ isFlashing: false }), 2400);
      // Ensure we clear totalTime so we don't beep again instantly if it re-renders
      setTimerState((prev) => ({ ...prev, totalTime: 0 }));
    }
  }, [
    timeLeft,
    isRunning,
    totalTime,
    playBeep,
    playFinishSound,
    setTimerState,
  ]);

  const constraintsRef = useRef<HTMLDivElement>(null);
  const switchRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0 });

  useEffect(() => {
    if (!constraintsRef.current || !switchRef.current) return;
    const observer = new ResizeObserver(() => {
      const cw = constraintsRef.current!.offsetWidth || 0;
      const sw = switchRef.current!.offsetWidth || 0;
      const isRtl = true;
      const bound = isRtl ? -(cw - sw) : (cw - sw);
      setDragBounds(isRtl ? { left: bound, right: 0 } : { left: 0, right: bound });

      if (isRunning && totalTime > 0) {
        const now = Date.now();
        const endTime = timerState.endTime;
        const preciseTimeLeft = endTime
          ? Math.max(0, (endTime - now) / 1000)
          : timeLeft;
        const percent = preciseTimeLeft / totalTime;

        if (!isPaused) {
          x.set(bound * percent);
          animate(x, 0, { duration: preciseTimeLeft, ease: "linear" });
        } else {
          animate(x, bound * percent, {
            duration: 0.2,
            type: "spring",
            stiffness: 400,
            damping: 40,
          });
        }
      } else if (isOpen) {
        if (
          Math.abs(
            cw - (constraintsRef.current?.parentElement?.offsetWidth || cw),
          ) < 5
        ) {
          x.set(bound);
        }
      } else if (!isRunning) {
        // Do nothing during shrink to avoid conflict with synchronized spring animation
      }
    });
    observer.observe(constraintsRef.current);
    return () => observer.disconnect();
  }, [isRunning, isPaused, totalTime, timerState.endTime, timeLeft, isOpen, language, x]);

  // Re-run animation when pause state changes
  useEffect(() => {
    const cw = constraintsRef.current?.offsetWidth || 0;
    const sw = switchRef.current?.offsetWidth || 0;
    if (cw === 0 || sw === 0) return;
    const isRtl = true;
    const bound = isRtl ? -(cw - sw) : (cw - sw);

    if (isRunning && totalTime > 0) {
      const now = Date.now();
      const endTime = timerState.endTime;
      const preciseTimeLeft = endTime
        ? Math.max(0, (endTime - now) / 1000)
        : timeLeft;
      const percent = preciseTimeLeft / totalTime;

      if (!isPaused) {
        x.set(bound * percent);
        animate(x, 0, { duration: preciseTimeLeft, ease: "linear" });
      } else {
        animate(x, bound * percent, {
          duration: 0.2,
          type: "spring",
          stiffness: 400,
          damping: 40,
        });
      }
    } else if (isOpen) {
      const parentW = constraintsRef.current?.parentElement?.offsetWidth || cw;
      const targetBound = isRtl ? -(parentW - sw) : (parentW - sw);
      animate(x, targetBound, {
        type: "spring",
        stiffness: 400,
        damping: 30,
      });
    } else if (!isRunning) {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  }, [isOpen, isPaused, isRunning, timerState.endTime, totalTime, timeLeft, language, x]);

  const handleStart = () => {
    // initialize audio context on user interaction
    getAudioCtx();

    let h = parseInt(inputH, 10);
    let m = parseInt(inputM, 10);
    let s = parseInt(inputS, 10);
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;
    if (isNaN(s)) s = 0;
    const total = h * 3600 + m * 60 + s;
    if (total > 0) {
      sounds.playStartTimer();
      safeVibrate(50);
      const now = Date.now();
      setTimerState((prev) => ({
        ...prev,
        totalTime: total,
        timeLeft: total,
        isRunning: true,
        endTime: now + total * 1000,
      }));
      animate(x, 0, { duration: total, ease: "linear" });
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
    }
    setIsOpen(false);
  };

  const cancelTimer = () => {
    globalCancelTimer();
    animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
  };

  const closeSettings = () => {
    setIsOpen(false);
    animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const thumbBg = useTransform(x, (currentX) => {
    if (isRunning) return "#ffb3b6";
    const maxDist = Math.abs(dragBounds.left);
    if (maxDist > 0 && currentX <= dragBounds.left + 5) {
      return "#ffb3b6";
    }
    return "#f4efe8";
  });

  const thumbShadow = useTransform(x, (currentX) => {
    // #ffb3b6
    const runShadow = adjustColor("#ffb3b6", -80);
    const runOutline = adjustColor("#ffb3b6", -150);
    const runStyle = `0 4px 0 0 ${runShadow}, 0 4px 0 1px ${runOutline}, 0 0 0 1px ${runOutline}, inset 0 0 0 3px #e8999c`;
    
    // #f4efe8
    const defShadow = adjustColor("#f4efe8", -80);
    const defOutline = adjustColor("#f4efe8", -150);
    const defStyle = `0 4px 0 0 ${defShadow}, 0 4px 0 1px ${defOutline}, 0 0 0 1px ${defOutline}, inset 0 0 0 3px #e3dbd1`;

    if (isRunning) return runStyle;
    const maxDist = Math.abs(dragBounds.left);
    if (maxDist > 0 && currentX <= dragBounds.left + 5) {
      return runStyle;
    }
    return defStyle;
  });

  const [showRightBtn, setShowRightBtn] = useState(false);

  useMotionValueEvent(x, "change", (latest) => {
    // Right button (cancel) - show if switch is dragged past it
    if ((isRunning || isPaused) && latest < -50) {
      if (!showRightBtn) setShowRightBtn(true);
    } else {
      if (showRightBtn) setShowRightBtn(false);
    }
  });

  const handleDragEnd = (e: any, info: any) => {
    if (!isRunning) {
      if (x.get() < dragBounds.left * 0.8) {
        setIsOpen(true);
        sounds.playClick();
        safeVibrate(50);
        animate(x, dragBounds.left, { type: "tween", duration: 0.2 });
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
      }
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const isExpanded =
    isOpen || isRunning || isPaused || (totalTime > 0 && timeLeft > 0);
  const isFlashingRed =
    flashEndParams.isFlashing || (isRunning && timeLeft > 0 && timeLeft <= 10);

  return (
    <div className="w-full relative mb-2 flex justify-center">
      {/* Container */}
      <motion.div
        ref={constraintsRef}
        animate={{ width: isExpanded ? "100%" : "clamp(34px,6.8vh,66px)" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`h-[clamp(34px,6.8vh,66px)] rounded-full relative flex items-center ${theme === 'night' ? 'bg-[#4a3b69]/40' : 'bg-black/5'} backdrop-blur-[2px] shrink-0 ${isExpanded ? "overflow-hidden" : ""}`}
        style={{ boxShadow: `inset 0 4px 0 ${theme === 'night' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}, 0 0 0 1.5px ${theme === 'night' ? '#111' : '#333'}` }}
      >
        {/* Base Timer Text (Black, shown on light track) */}
        {isRunning && (
          <div
            className="absolute inset-0 flex items-center justify-center font-normal text-[#333] z-0 pointer-events-none text-xl sm:text-2xl"
            style={{ direction: "ltr" }}
          >
            {formatTime(timeLeft)}
          </div>
        )}

        {/* Animated Gradient Fill */}
        <motion.div
          className={`absolute right-0 top-0 h-full rounded-full overflow-hidden`}
          style={{
            width: useTransform(
              x,
              (curr) =>
                Math.max(
                  (-curr) +
                    ((switchRef.current?.offsetWidth || 0) * 0.5 || 28) +
                    16,
                  0,
                ) + "px",
            ),
          }}
          animate={{ opacity: isOpen || (!isRunning && !isPaused) ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`absolute left-auto right-0 bg-gradient-to-l top-0 h-full from-[#FA6B6B] to-[#FFDAB9]`}
            style={{ width: constraintsRef.current?.offsetWidth || "100vw" }}
          >
            <div className="absolute inset-0 shadow-[inset_0_4px_0_#b8595c] pointer-events-none rounded-full" />
            {/* Overlay Timer Text (White, masked with gradient) */}
            {isRunning && (
              <div
                className="absolute inset-0 flex items-center justify-center font-normal text-white z-0 pointer-events-none text-xl sm:text-2xl"
                style={{ direction: "ltr" }}
              >
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {showRightBtn && (
            <motion.button
              key="right-btn"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={cancelTimer}
              className={`absolute right-[16px] z-10 w-[clamp(24px,3.5vh,28px)] h-[clamp(24px,3.5vh,28px)] bg-white text-[#333] border-[1.5px] border-[#333] shadow-[inset_0_-2px_0_0_#d1d5db] active:shadow-[inset_0_0px_0_0_#d1d5db] rounded-full flex items-center justify-center active:pt-[calc(2px)] transition-all cursor-pointer`}
            >
              <XIcon size={16} strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Thumb */}
        <motion.div
          ref={switchRef}
          drag={!isRunning && isExpanded ? "x" : false}
          dragConstraints={dragBounds}
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (isRunning || isPaused) {
              togglePause();
              sounds.playClick();
              safeVibrate(50);
            } else if (!isExpanded) {
              setIsOpen(true);
              sounds.playClick();
              safeVibrate(50);
            }
          }}
          style={{ x, backgroundColor: thumbBg, boxShadow: thumbShadow }}
          className={`absolute right-0 top-0 h-full aspect-square rounded-full flex items-center justify-center z-20 cursor-grab active:cursor-grabbing overflow-hidden`}
        >
          {isFlashingRed && (
            <motion.div
              key={flashEndParams.isFlashing ? "end-flash-thumb" : timeLeft}
              className="absolute inset-0 z-0 pointer-events-none rounded-full"
              style={{ backgroundColor: "#ffb3b6" }}
              animate={{ backgroundColor: ["#FA6B6B", "#ffffff"] }}
              transition={{
                duration: flashEndParams.isFlashing ? 0.8 : 1,
                repeat: flashEndParams.isFlashing ? 2 : 0,
                ease: "easeOut",
              }}
            />
          )}
          <motion.div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              position: "relative",
              zIndex: 1,
            }}
          >
            {isRunning || isPaused ? (
              isPaused ? (
                <Play
                  size={24}
                  fill="currentColor"
                  className="ml-1 text-[#333]"
                />
              ) : (
                <Pause size={24} fill="currentColor" className="text-[#333]" />
              )
            ) : (
              <img
                src="/Icons_Vector/Timer.svg"
                alt="Timer"
                className="absolute w-full h-full object-contain pointer-events-none scale-[0.75]"
                style={{ filter: "brightness(0)" }}
              />
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Settings Modal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className={`${theme === 'night' ? 'bg-[#1b2554] border-[#222] shadow-[0_4px_0_0_#222]' : 'bg-[#fcf9f2] border-[#e5e5e5] shadow-[0_4px_0_0_#e5e5e5]'} border-2 rounded-3xl p-6 max-w-sm w-full`}
              >
                <h2 className={`text-xl font-normal text-center mb-6 ${theme === 'night' ? 'text-white' : 'text-[#333]'}`}>
                  {language === 'en' ? 'Timer Settings' : 'הגדרת טיימר'}
                </h2>

                <div
                  className="flex justify-center gap-2 sm:gap-4 text-center"
                  dir="ltr"
                >
                  <div className="flex flex-col items-center">
                    <DigitWheel value={inputH} onChange={setInputH} max={100} />
                    <span className={`text-[10px] sm:text-sm font-normal mt-1 ${theme === 'night' ? 'text-white' : 'text-[#333]/60'}`}>
                      {language === 'en' ? 'Hours' : 'שעות'}
                    </span>
                  </div>
                  <div className={`text-3xl font-normal mt-2 sm:mt-3 ${theme === 'night' ? 'text-white' : 'text-[#333]'}`}>
                    :
                  </div>
                  <div className="flex flex-col items-center">
                    <DigitWheel value={inputM} onChange={setInputM} max={60} />
                    <span className={`text-[10px] sm:text-sm font-normal mt-1 ${theme === 'night' ? 'text-white' : 'text-[#333]/60'}`}>
                      {language === 'en' ? 'Minutes' : 'דקות'}
                    </span>
                  </div>
                  <div className={`text-3xl font-normal mt-2 sm:mt-3 ${theme === 'night' ? 'text-white' : 'text-[#333]'}`}>
                    :
                  </div>
                  <div className="flex flex-col items-center">
                    <DigitWheel value={inputS} onChange={setInputS} max={60} />
                    <span className={`text-[10px] sm:text-sm font-normal mt-1 ${theme === 'night' ? 'text-white' : 'text-[#333]/60'}`}>
                      {language === 'en' ? 'Seconds' : 'שניות'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  {(() => {
                    const strokeColor = '#333';
                    const activeBgCancel = theme === 'night' ? '#4a3b69' : '#ffffff';
                    const activeBgStart = theme === 'night' ? '#ae9cee' : '#bae1ff';
                    const cancelShadowColor = adjustColor(activeBgCancel, theme === "night" ? -40 : -50);
                    const startShadowColor = adjustColor(activeBgStart, theme === "night" ? -40 : -50);
                    const cancelShadow = `0 4px 0 0 ${cancelShadowColor}, 0 0 0 1.5px ${strokeColor}, 0 4px 0 1.5px ${strokeColor}`;
                    const startShadow = `0 4px 0 0 ${startShadowColor}, 0 0 0 1.5px ${strokeColor}, 0 4px 0 1.5px ${strokeColor}`;
                    const cancelPressed = `0 0 0 1.5px ${strokeColor}`;
                    const startPressed = `0 0 0 1.5px ${strokeColor}`;

                    return (
                      <>
                        <button
                          onClick={closeSettings}
                          className={`flex-1 py-3 rounded-xl font-normal transition-all border-none ${theme === 'night' ? 'text-white' : 'text-[#333]'}`}
                          style={{ backgroundColor: activeBgCancel, boxShadow: cancelShadow }}
                          onPointerDown={(e) => { e.currentTarget.style.boxShadow = cancelPressed; e.currentTarget.style.transform = 'translateY(4px)'; }}
                          onPointerUp={(e) => { e.currentTarget.style.boxShadow = cancelShadow; e.currentTarget.style.transform = 'none'; }}
                          onPointerLeave={(e) => { e.currentTarget.style.boxShadow = cancelShadow; e.currentTarget.style.transform = 'none'; }}
                        >
                          {language === 'en' ? 'Cancel' : 'ביטול'}
                        </button>
                        <button
                          onClick={handleStart}
                          className={`flex-1 py-3 rounded-xl font-normal transition-all border-none ${theme === 'night' ? 'text-white' : 'text-[#333]'}`}
                          style={{ backgroundColor: activeBgStart, boxShadow: startShadow }}
                          onPointerDown={(e) => { e.currentTarget.style.boxShadow = startPressed; e.currentTarget.style.transform = 'translateY(4px)'; }}
                          onPointerUp={(e) => { e.currentTarget.style.boxShadow = startShadow; e.currentTarget.style.transform = 'none'; }}
                          onPointerLeave={(e) => { e.currentTarget.style.boxShadow = startShadow; e.currentTarget.style.transform = 'none'; }}
                        >
                          {language === 'en' ? 'Start' : 'התחל'}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

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
    { taskId: "clothes", layerName: "Clothes" },
    {
      taskId: "hair",
      layerName: "Hair_Shadow",
      blendMode: "multiply",
      exactFileName: "Hair_On_Shadow.svg",
      hideWhenOff: true,
    },
    { taskId: "hair", layerName: "Hair" },
    { taskId: "shoes", layerName: "Shoes" },
    { taskId: "face", layerName: "Face" },
    { taskId: "teeth", layerName: "Teeth" },
  ],
  day_maayani: [
    { taskId: "clothes", layerName: "Clothes" },
    { taskId: "shoes", layerName: "Shoes" },
    { taskId: "face", layerName: "Face" },
    { taskId: "teeth", layerName: "Teeth" },
  ],
  day_pelegi: [
    { taskId: "hair", layerName: "Hair" },
    { taskId: "clothes", layerName: "Clothes" },
    { taskId: "shoes", layerName: "Shoes" },
    { taskId: "face", layerName: "Face" },
    { taskId: "teeth", layerName: "Teeth" },
  ],
  night_yuvali: [
    {
      taskId: "hair",
      layerName: "Hair_Off_Shadow",
      blendMode: "multiply",
      exactFileName: "Hair_Off_Shadow.svg",
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
    timerState,
    cancelTimer,
    settings,
  } = useUser();
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  const kidsConfig = getKids(theme, language);
  const kid = kidsConfig[kidId];
  
  // Apply hidden and custom tasks
  const kidSettings = (settings && settings[kidId]) || { hiddenTasks: [], customTasks: [] };
  const hiddenTasks = kidSettings.hiddenTasks || [];
  const customTasks = kidSettings.customTasks || [];
  const baseTasks = getTasksForKid(kidId, theme, language).filter(t => !hiddenTasks.includes(t.id));
  
  const customTasksMapped: Task[] = customTasks
    .filter(ct => ct.theme === theme || (!ct.theme && theme === 'day'))
    .map((ct) => ({
      id: ct.id,
      title: ct.title,
      iconOff: `/Icons_Vector/${ct.iconName}`,
      iconOn: `/Icons_Vector/${ct.iconName}`,
      side: 'left' // Will be rebalanced below
    }));

  const combinedTasks = [...baseTasks, ...customTasksMapped];
  const rightColumnCount = Math.ceil(combinedTasks.length / 2);
  const allKidTasks = combinedTasks.map((t, index) => ({
    ...t,
    side: index < rightColumnCount ? 'right' : 'left' as 'left' | 'right'
  }));

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
      if (timerState.isRunning) {
        cancelTimer();
      }
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
          backgroundImage: theme === 'night' ? "radial-gradient(#4a3b69 1px, transparent 1px)" : "radial-gradient(#d1d5db 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <motion.div
        initial={{
          y: 15,
          scale: 0.9,
          opacity: 0,
          boxShadow: theme === 'night' ? "0px 0px 0px rgba(0,0,0,0)" : "0px 0px 0px rgba(0,0,0,0)",
        }}
        animate={{ 
          y: 0, 
          scale: 1, 
          opacity: 1, 
          boxShadow: `0 6px 0 0 ${theme === 'night' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}, 0 0 0 1.5px rgba(0, 0, 0, 0.5), 0 6px 0 1.5px rgba(0, 0, 0, 0.5)`
        }}
        exit={{ scale: 0.1, y: 50, opacity: 0 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 15 }}
        className={`flex flex-col flex-1 w-full min-h-0 backdrop-blur-sm rounded-3xl mb-2 px-2.5 pt-2.5 pb-0 box-border relative overflow-y-auto overflow-x-hidden z-10 ${
          theme === "night"
            ? "bg-[#1b2554]/60 text-white"
            : "bg-white/75 text-[#333]"
        }`}
      >
        <div className={`grid grid-cols-[clamp(70px,24vw,110px)_1fr_clamp(70px,24vw,110px)] items-center w-full pt-2 pb-4 border-b shrink-0 ${theme === 'night' ? 'border-white/10' : 'border-black/5'}`}>
          <div className="flex justify-center w-full px-2">
            <h3
              className={`m-0 text-xl font-normal transition-colors duration-200 ${theme === "night" ? "text-white" : "text-[#333]"}`}
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
                    <div className={`flex items-center gap-1 ${theme === 'night' ? 'text-white' : 'text-[#333]'}`}>
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
                      <span className="text-sm font-normal mt-[1px]">×</span>
                      <span className="text-sm font-normal">{starsCount}</span>
                    </div>
                  )}
                </div>
              ) : (
                <span className={`text-[10px] font-normal whitespace-nowrap ${theme === 'night' ? 'text-white/50' : 'text-[#333]/30'}`}>
                  {language === 'en' ? 'No stars yet' : 'אין כוכבים עדיין'}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center w-full px-2">
            {(() => {
              const homeBg = theme === "night" ? "#76639c" : "#fde4cf";
              const homeShadowColor = adjustColor(homeBg, theme === "night" ? -40 : -50);
              const homeStrokeColor = theme === "night" ? "#111" : "#333";
              const activeHomeShadow = `
                0 4px 0 0 ${homeShadowColor},
                0 0 0 1.5px ${homeStrokeColor},
                0 4px 0 1.5px ${homeStrokeColor}
              `;
              const pressedHomeShadow = `
                0 0 0 1.5px ${homeStrokeColor}
              `;

              return (
                <motion.button
                  initial={{ y: 4, boxShadow: pressedHomeShadow }}
                  animate={
                    isReady
                      ? { y: 0, boxShadow: activeHomeShadow }
                      : { y: 4, boxShadow: pressedHomeShadow }
                  }
                  whileTap={{ y: 4, boxShadow: pressedHomeShadow }}
                  transition={{
                    type: "spring" as const,
                    stiffness: 800,
                    damping: 15,
                  }}
                  className={`p-1.5 rounded-full cursor-pointer flex items-center justify-center w-10 h-10 border-none relative touch-none`}
                  style={{
                    backgroundColor: homeBg,
                  }}
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
                      fill="none"
                      stroke={theme === "night" ? "#FFFFFF" : "rgba(0,0,0,0.6)"}
                    />
                  </svg>
                </motion.button>
              );
            })()}
          </div>
        </div>

        <div className="flex-1 flex flex-col w-full my-0 min-h-0 gap-1 sm:gap-2 lg:gap-3">
          <div className="flex-1 grid grid-cols-[clamp(70px,24vw,110px)_1fr_clamp(70px,24vw,110px)] items-stretch justify-items-center w-full min-h-0 relative">
            {/* Right Tasks */}
            <div className="flex flex-col justify-start gap-0 sm:gap-0.5 h-full w-full items-center z-10 py-0 min-h-0 relative mt-[clamp(19px,5vh,35px)]">
              {rightTasks.map((t, i) => (
                <TaskButton
                  key={t.id}
                  task={t}
                  kid={kid}
                  isCompleted={themeCompletedTasks.has(t.id)}
                  isReady={isReady}
                  onClick={() => toggleTask(t.id)}
                  colorIndex={i}
                  totalItems={rightTasks.length}
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
                    : `/${theme}/summer/${folderName}/${layerName}_${layerState}.svg`;

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
            </div>

            {/* Left Tasks */}
            <div className="flex flex-col justify-start gap-0 sm:gap-0.5 h-full w-full items-center z-10 py-0 min-h-0 relative mt-[clamp(19px,5vh,35px)]">
              {leftTasks.map((t, i) => (
                <TaskButton
                  key={t.id}
                  task={t}
                  kid={kid}
                  isCompleted={themeCompletedTasks.has(t.id)}
                  isReady={isReady}
                  onClick={() => toggleTask(t.id)}
                  colorIndex={i}
                  totalItems={leftTasks.length}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col w-full gap-2 sm:gap-3 mt-auto pt-1 sm:pt-2">
            <VisualTimer />

            {/* Progress Bar */}
            <div className="relative w-full h-[clamp(34px,6.8vh,66px)] shrink-0">
              {/* Active Rotating Border Glow Layer */}
              <motion.div
                key={progressPct === 100 ? "glow-100" : "glow-part"}
                className="absolute pointer-events-none z-40"
                style={{
                  inset: "-1.5px",
                  borderRadius: "9999px",
                  padding: "4px",
                  background: `conic-gradient(from var(--border-angle), transparent 20%, ${kid.colorB} 50%, ${kid.colorA} 85%, rgba(255,255,255,1) 98%, rgba(255,255,255,1) 100%)`,
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  filter: "blur(4px)",
                }}
                initial={{ "--border-angle": "0deg", opacity: 0 } as any}
                animate={
                  progressPct === 100 
                  ? { "--border-angle": ["0deg", "360deg"], opacity: [1, 1, 0] }
                  : { "--border-angle": ["0deg", "360deg"], opacity: [0, 0.8, 0.8, 0] }
                }
                transition={
                  progressPct === 100
                  ? { "--border-angle": { duration: 1.2, ease: "easeOut" }, opacity: { duration: 1.2, ease: "easeOut", times: [0, 0.8, 1] } }
                  : { "--border-angle": { duration: 3.5, repeat: Infinity, repeatDelay: 2.0, ease: "linear" }, opacity: { duration: 3.5, repeat: Infinity, repeatDelay: 2.0, ease: "linear", times: [0, 0.1, 0.9, 1] } }
                }
              />

              {/* Active Rotating Border Solid Layer */}
              <motion.div
                key={progressPct === 100 ? "solid-100" : "solid-part"}
                className="absolute pointer-events-none z-50"
                style={{
                  inset: "0px",
                  borderRadius: "9999px",
                  padding: "1.5px",
                  background: `conic-gradient(from var(--border-angle), transparent 30%, ${kid.colorB} 60%, ${kid.colorA} 90%, rgba(255,255,255,1) 98%, rgba(255,255,255,1) 100%)`,
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
                initial={{ "--border-angle": "0deg", opacity: 0 } as any}
                animate={
                  progressPct === 100 
                  ? { "--border-angle": ["0deg", "360deg"], opacity: [1, 1, 0] }
                  : { "--border-angle": ["0deg", "360deg"], opacity: [0, 1, 1, 0] }
                }
                transition={
                  progressPct === 100
                  ? { "--border-angle": { duration: 1.2, ease: "easeOut" }, opacity: { duration: 1.2, ease: "easeOut", times: [0, 0.8, 1] } }
                  : { "--border-angle": { duration: 3.5, repeat: Infinity, repeatDelay: 2.0, ease: "linear" }, opacity: { duration: 3.5, repeat: Infinity, repeatDelay: 2.0, ease: "linear", times: [0, 0.1, 0.9, 1] } }
                }
              />

              {/* Original Progress Bar Container */}
              <div className={`absolute inset-0 rounded-full z-10 box-border border-[1.5px] ${theme === 'night' ? 'border-[rgba(17,17,17,0.42)] bg-white/10' : 'border-[rgba(0,0,0,0.42)] bg-black/5'} p-[clamp(3px,0.8vh,6px)] flex items-center`}>
                <div className={`w-full h-full rounded-full overflow-hidden relative z-20 ${theme === 'night' ? 'bg-[#0f173c]' : 'bg-white'}`}>
                {progressPct === 0 && (
                  <div
                    className="absolute start-0 top-0 h-full aspect-square rounded-full flex shrink-0"
                    style={{
                      backgroundImage: kid.gradient,
                      clipPath: "circle(4px at center)",
                    }}
                  />
                )}
                <div
                  className="h-full rounded-full relative z-10 overflow-hidden"
                  style={{
                    width: `${progressPct}%`,
                    transition: "width 0.5s cubic-bezier(0.175,0.885,0.32,1.275)",
                  }}
                >
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: kid.gradient,
                    }}
                  />
                </div>
              </div>
              {/* The star at the end */}
              <div className="absolute end-[20px] z-20 flex items-center justify-center h-full pointer-events-none">
                {progressPct === 100 ? (
                  <motion.div
                    key="winner-star"
                    animate={{
                      scale: [1, 1.3, 1],
                      filter: [
                        "drop-shadow(0 0 0px #fffbed)",
                        "drop-shadow(0 0 12px #fffbed)",
                        "drop-shadow(0 0 0px transparent)",
                      ],
                      opacity: [1, 1, 0],
                    }}
                    transition={{ duration: 1.5, ease: "easeOut", times: [0, 0.4, 1] }}
                  >
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{
                        fill: ["#fffbed", "#fffbed", theme === 'night' ? "rgba(255,255,255,0)" : kid.outlineColor],
                        stroke: ["#ffffff", "#ffffff", theme === 'night' ? "rgba(255,255,255,0)" : kid.outlineColor],
                      }}
                      transition={{ duration: 1.5, ease: "easeOut", times: [0, 0.4, 1] }}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </motion.svg>
                  </motion.div>
                ) : (
                  <Star className={theme === 'night' ? 'text-white/30' : 'text-[#333]/30'} size={24} strokeWidth={2} />
                )}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex flex-col items-center shrink-0 mt-3 sm:mt-4 mb-2 relative">
          <div className="flex items-end gap-4 min-h-[48px]">
            {role === "parent" && (
              <button
                onClick={() => handleUpdateStars(-1)}
                className={`w-10 h-10 rounded-full bg-white flex items-center justify-center border-none touch-none text-[#333] transition-all`}
                style={{
                  boxShadow: `0 4px 0 0 #d1d5db, 0 0 0 1.5px #333, 0 4px 0 1.5px #333`,
                }}
                onPointerDown={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1.5px #333`; e.currentTarget.style.transform = 'translateY(4px)'; }}
                onPointerUp={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 #d1d5db, 0 0 0 1.5px #333, 0 4px 0 1.5px #333`; e.currentTarget.style.transform = 'none'; }}
                onPointerLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 #d1d5db, 0 0 0 1.5px #333, 0 4px 0 1.5px #333`; e.currentTarget.style.transform = 'none'; }}
              >
                <Minus size={20} className="text-[#333]" />
              </button>
            )}

            {(() => {
              const isActive = themeCompletedTasks.size > 0;
              // User requested always same color as day theme, and black outline (so it looks like task buttons)
              const shadowColor = isActive ? adjustColor("#bae1ff", -50) : "transparent";
              const bgColorClass = isActive ? "bg-[#bae1ff]" : "bg-transparent";
                  
              const opacityClass = isActive ? 'opacity-100' : 'opacity-40';
              const strokeColor = isActive ? "#333" : (theme === 'night' ? 'rgba(255,255,255,1)' : '#333');
              const textColor = isActive ? "text-[#333]" : (theme === 'night' ? 'text-white' : 'text-[#333]');

              return (
                <button
                  disabled={!isActive}
                  className={`px-6 rounded-2xl font-normal text-sm ${bgColorClass} ${textColor} ${opacityClass} transition-[transform,box-shadow,color,background-color] duration-300 ${isActive ? 'py-2 pt-2 pb-3 cursor-pointer' : 'py-2 pt-3 pb-2 cursor-default'}`}
                  style={{
                    boxShadow: isActive ? `0 4px 0 0 ${shadowColor}, 0 0 0 1.5px ${strokeColor}, 0 4px 0 1.5px ${strokeColor}` : `0 0px 0 0 transparent, 0 0 0 1.5px ${strokeColor}, 0 0px 0 1.5px ${strokeColor}`,
                    transform: isActive ? 'translateY(0px)' : 'translateY(4px)'
                  }}
                  onPointerDown={(e) => { 
                    if (!isActive) return;
                    e.currentTarget.style.boxShadow = `0 0 0 1.5px ${strokeColor}`; 
                    e.currentTarget.style.transform = 'translateY(4px)';
                  }}
                  onPointerUp={(e) => { 
                    if (!isActive) return;
                    e.currentTarget.style.boxShadow = `0 4px 0 0 ${shadowColor}, 0 0 0 1.5px ${strokeColor}, 0 4px 0 1.5px ${strokeColor}`; 
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}
                  onPointerLeave={(e) => { 
                    if (!isActive) return;
                    e.currentTarget.style.boxShadow = `0 4px 0 0 ${shadowColor}, 0 0 0 1.5px ${strokeColor}, 0 4px 0 1.5px ${strokeColor}`; 
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}
                  onClick={async () => {
                    if (themeCompletedTasks.size === 0) return;
                    safeVibrate(5);
                    sounds.playReset();

                    // Only reset the tasks for the current theme
                    const resetTasks = Array.from(completedTasks).filter((t) =>
                      t.startsWith(`${theme}_`),
                    );

                    if (resetTasks.length > 0) {
                      await resetKidTasks(kidId, resetTasks);
                    }
                  }}
                >
                  {language === 'en' ? 'Start Over' : (kidId === "yuvali" ? "התחילי מחדש" : "התחל מחדש")}
                </button>
              );
            })()}

            {role === "parent" && (
              <button
                onClick={() => handleUpdateStars(1)}
                className={`w-10 h-10 rounded-full bg-white flex items-center justify-center border-none touch-none text-[#333] transition-all`}
                style={{
                  boxShadow: `0 4px 0 0 #d1d5db, 0 0 0 1.5px #333, 0 4px 0 1.5px #333`,
                }}
                onPointerDown={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1.5px #333`; e.currentTarget.style.transform = 'translateY(4px)'; }}
                onPointerUp={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 #d1d5db, 0 0 0 1.5px #333, 0 4px 0 1.5px #333`; e.currentTarget.style.transform = 'none'; }}
                onPointerLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 #d1d5db, 0 0 0 1.5px #333, 0 4px 0 1.5px #333`; e.currentTarget.style.transform = 'none'; }}
              >
                <Plus size={20} className="text-[#333]" />
              </button>
            )}
          </div>

          <div className="min-h-[40px] mt-3 flex items-center justify-center shrink-0">
            {starsCount > 0 && role === "parent" && (
              <button
                className={`text-[10px] ${theme === 'night' ? 'text-white/40' : 'text-[#333]/40'} underline bg-transparent border-none cursor-pointer p-0.5`}
                onClick={async () => {
                  safeVibrate(5);
                  localStorage.removeItem(`lastStarDate_${theme}_${kidId}`);
                  await updateStar(kidId, 0);
                }}
              >
                {language === 'en' ? 'Reset Stars' : 'איפוס כוכבים'}
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
  kid: KidConfig;
  isCompleted: boolean;
  isReady: boolean;
  onClick: () => void;
  colorIndex: number;
  totalItems: number;
  key?: string;
}

function TaskButton({
  task,
  kid,
  isCompleted,
  isReady,
  onClick,
  colorIndex,
  totalItems,
}: TaskButtonProps) {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const controls = useAnimation();

  const normalizedT = totalItems > 1 ? colorIndex / (totalItems - 1) : 0;

  const onBg = interpolateColor(kid.colorA, kid.colorB, normalizedT);
  const offBg = theme === "night" ? "#babcce" : "#f5f5f5";
  const currentBg = isCompleted ? onBg : offBg;
  const strokeColor = theme === "night" ? "#111" : "#333";
  const shadowColor = adjustColor(currentBg, theme === "night" ? -40 : -80);

  // t('offBg') match background but slight difference
  // GameScreen bg is bg-[#cdd1e4] night, bg-white day

  // Use backgroundImage for a subtle gradient on the button itself
  const currentBgGradient = `linear-gradient(to bottom, ${currentBg}, ${adjustColor(currentBg, -15)})`;

  const activeShadow = `
    0 4px 0 0 ${shadowColor},
    0 0 0 1.5px ${strokeColor},
    0 4px 0 1.5px ${strokeColor}
  `;
  const pressedShadow = `
    0 0 0 1.5px ${strokeColor}
  `;

  const buttonWidth = "clamp(32px,min(16vw,12vh),88px)";

  useEffect(() => {
    if (isReady) {
      if (!isPressed) {
        controls.start({
          y: 0,
          boxShadow: activeShadow,
          background: currentBgGradient,
          border: 'none',
          borderRadius: "9999px",
          width: buttonWidth,
        });
      }
    } else {
      controls.start({
        y: 4,
        boxShadow: pressedShadow,
        background: currentBgGradient,
        border: 'none',
        borderRadius: "9999px",
        width: buttonWidth,
      });
    }
  }, [
    isReady,
    isCompleted,
    activeShadow,
    pressedShadow,
    currentBgGradient,
    strokeColor,
    isPressed,
    controls,
    buttonWidth,
  ]);

  const handlePointerDown = () => {
    setIsPressed(true);
    const anticipatedCompleted = !isCompleted;
    const anticipatedBg = anticipatedCompleted ? onBg : offBg;
    const anticipatedBgGradient = `linear-gradient(to bottom, ${anticipatedBg}, ${adjustColor(anticipatedBg, -15)})`;
    
    controls.start({
      y: 4,
      boxShadow: pressedShadow,
      background: anticipatedBgGradient,
      border: 'none',
      borderRadius: "9999px",
      width: buttonWidth,
      transition: { type: "spring" as const, stiffness: 1000, damping: 20 },
    });
  };

  const handlePointerUp = () => {
    if (!isPressed) return;
    setIsPressed(false);

    const anticipatedCompleted = !isCompleted;
    const anticipatedBg = anticipatedCompleted ? onBg : offBg;
    const anticipatedBgGradient = `linear-gradient(to bottom, ${anticipatedBg}, ${adjustColor(anticipatedBg, -15)})`;
    const anticipatedActiveShadow = `0px 4px 0px 0px ${strokeColor}`;

    controls.start({
      y: 0,
      boxShadow: anticipatedActiveShadow,
      background: anticipatedBgGradient,
      border: `1.5px solid ${strokeColor}`,
      borderRadius: "9999px",
      width: buttonWidth,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 20,
      },
    });

    onClick();
  };

  const handlePointerCancel = () => {
    if (!isPressed) return;
    setIsPressed(false);
    controls.start({
      y: 0,
      boxShadow: activeShadow,
      background: currentBgGradient,
      border: `1.5px solid ${strokeColor}`,
      borderRadius: "9999px",
      width: buttonWidth,
      transition: { type: "spring" as const, stiffness: 400, damping: 20 },
    });
  };

  return (
    <div className="flex flex-col items-center justify-start w-full gap-0.5">
      <motion.button
        initial={{
          y: isReady ? 0 : 4,
          boxShadow: isReady ? activeShadow : pressedShadow,
          background: currentBgGradient,
          border: `1.5px solid ${strokeColor}`,
          borderRadius: "9999px",
          width: buttonWidth,
        }}
        animate={controls}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        className={`h-[clamp(24px,min(12.7vw,9.6vh),70px)] flex items-center justify-center p-1 touch-none shrink-0 overflow-hidden relative rounded-full`}
      >
        <img
          src={isCompleted ? task.iconOn : task.iconOff}
          alt={task.title}
          className={`${task.id === 'face' || task.id === 'dinner' ? "w-[56%] h-[56%]" : "w-[70%] h-[70%]"} object-contain pointer-events-none transition-all duration-300 absolute`}
          style={{
            filter: "brightness(0)",
            opacity: isCompleted 
              ? 0.9 
              : theme === "night" 
                ? 0.7 
                : 0.6,
          }}
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${task.title}&background=random&color=fff&rounded=true&size=128`;
          }}
        />
      </motion.button>
      <div className="h-[clamp(20px,3.2vh,32px)] flex items-center justify-center w-full shrink-0">
        <span className={`block text-[clamp(9px,min(2.5vw,1.8vh),13.5px)] font-normal text-center leading-[1.1] whitespace-pre-line px-1 break-words line-clamp-2 ${theme === 'night' ? 'text-white' : 'text-[#333]'}`}>
          {task.title}
        </span>
      </div>
    </div>
  );
}
