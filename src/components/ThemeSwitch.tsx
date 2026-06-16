import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "motion/react";
import { sounds, safeVibrate } from "../utils/sounds";
import { adjustColor } from "../utils/colors";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  const isNight = theme === "night";
  const bgColor = isNight ? "#3b2354" : "#FDC4C1";
  const bgOutline = isNight ? adjustColor(bgColor, -60) : adjustColor(bgColor, -120);
  const trackInnerShadow = isNight ? adjustColor(bgColor, -50) : "#d17772";

  const thumbColor = isNight ? "#2a1a45" : "#FFFDE1";
  const thumbDropShadow = isNight ? adjustColor(thumbColor, -50) : "#c4706b";
  const thumbOutline = isNight ? "#311c47" : adjustColor("#c4706b", -120);

  const handleToggle = () => {
    safeVibrate(5);
    sounds.playClick();
    toggleTheme();
  };

  return (
    <div className="flex items-center justify-center mt-6">
      <motion.button
        onClick={handleToggle}
        className="w-[170px] h-[94px] rounded-full flex relative overflow-hidden cursor-pointer outline-none"
        animate={{
          backgroundColor: bgColor,
          boxShadow: `inset 0 4px 0 ${trackInnerShadow}, 0 0 0 ${isNight ? "1px" : "1.5px"} ${bgOutline}`,
        }}
        transition={{ 
          duration: 0.5, 
          boxShadow: { duration: isNight ? 0.5 : 0.9, ease: "easeInOut" } 
        }}
      >
        {/* Thumb */}
        <motion.div
           initial={false}
           animate={{
             left: isNight ? "0px" : "76px",
             backgroundColor: thumbColor,
             boxShadow: `0 4px 0 0 ${thumbDropShadow}, 0 4px 0 ${isNight ? "1px" : "1.5px"} ${thumbOutline}, 0 0 0 ${isNight ? "1px" : "1.5px"} ${thumbOutline}`,
           }}
           transition={{ duration: 0.3, ease: "easeOut" }}
           className="w-[94px] h-[94px] absolute top-[0px] rounded-full z-10 flex items-center justify-center"
        >
          {/* Thumb Icons - Crossfade overlap */}
          <motion.img
            src="/Icons_Vector/Moon.png"
            alt="Night"
            initial={false}
            animate={{
              opacity: isNight ? 1 : 0,
              rotate: isNight ? 0 : 90,
            }}
            transition={{
              duration: 0.3,
              rotate: { ease: "linear", duration: 0.3 },
              opacity: { ease: "easeOut", duration: 0.3 },
            }}
            className="absolute w-full h-full object-contain pointer-events-none"
            onError={(e: any) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <motion.img
            src="/Icons_Vector/Sun.png"
            alt="Day"
            initial={false}
            animate={{
              opacity: !isNight ? 1 : 0,
              rotate: isNight ? -90 : 0,
            }}
            transition={{
              duration: 0.3,
              rotate: { ease: "linear", duration: 0.3 },
              opacity: { ease: "easeOut", duration: 0.3 },
            }}
            className="absolute w-full h-full object-contain pointer-events-none"
            onError={(e: any) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </motion.div>
      </motion.button>
    </div>
  );
}
