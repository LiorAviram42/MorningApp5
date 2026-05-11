import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "motion/react";
import { sounds, safeVibrate } from "../utils/sounds";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  const isNight = theme === "night";

  const handleToggle = () => {
    safeVibrate(5);
    sounds.playClick();
    toggleTheme();
  };

  return (
    <div className="flex items-center justify-center mt-6">
      <button
        onClick={handleToggle}
        className={`w-[170px] h-[94px] rounded-full flex relative overflow-hidden cursor-pointer outline-none border-2 border-[#000] transition-colors duration-500 ${
          isNight ? "bg-[#3b2354]" : "bg-[#FDC4C1]"
        }`}
        style={{ boxShadow: "inset 0 4px 0 #000" }}
      >
        {/* Thumb */}
        <motion.div
          initial={false}
          animate={{
            left: isNight ? "-2px" : "74px", // 170 width - 94 thumb - 2 border = 74
          }}
          transition={{ ease: "easeOut", duration: 0.3 }}
          className={`w-[94px] h-[94px] absolute top-[-2px] rounded-full z-10 flex items-center justify-center border-2 border-[#000] shadow-[0_4px_0_#000] transition-colors duration-500 ${
            isNight ? "bg-[#2a1a45]" : "bg-[#FFFDE1]"
          }`}
        >
          {/* Thumb Icons - Crossfade overlap */}
          <motion.img
            src="/day/Icons/Moon.png"
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
            className="absolute w-[100%] h-[100%] object-contain pointer-events-none"
            onError={(e: any) => {
              e.currentTarget.src = "/day/Icons/moon_icon.png";
            }}
          />
          <motion.img
            src="/day/Icons/Sun.png"
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
            className="absolute w-[100%] h-[100%] object-contain pointer-events-none"
            onError={(e: any) => {
              e.currentTarget.src = "/day/Icons/sun_icon.png";
            }}
          />
        </motion.div>
      </button>
    </div>
  );
}
