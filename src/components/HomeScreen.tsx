import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getKids } from "../constants";
import { KidId } from "../types";
import { sounds, safeVibrate } from "../utils/sounds";
import { useUser } from "../contexts/UserContext";
import ThemeSwitch from "./ThemeSwitch";
import { useTheme } from "../contexts/ThemeContext";
import { adjustColor } from "../utils/colors";

interface Props {
  onSelectKid: (kidId: KidId) => void;
  hasMagicBg?: boolean;
}

export default function HomeScreen({ onSelectKid }: Props) {
  const { role, stars, loading } = useUser();
  const [animatingKid, setAnimatingKid] = useState<KidId | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "night" ? "#0f173c" : "#C5E9F1",
      );
    }
  }, [theme]);

  const handleSelect = (kidId: KidId) => {
    safeVibrate(5);
    sounds.playSelect();
    setAnimatingKid(kidId);
    setTimeout(() => {
      onSelectKid(kidId);
    }, 150);
  };

  const kidsConfig = getKids(theme);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center h-full w-full absolute inset-0 overflow-y-auto overflow-x-hidden box-border pb-12"
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#333 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="flex-1 flex flex-col justify-center z-10 w-full">
        <h1
          className={`text-5xl font-bold text-center drop-shadow-sm transition-colors duration-200 ${theme === "night" ? "text-white" : "text-[#333]"}`}
          style={{ transitionDelay: theme === "night" ? "0ms" : "200ms" }}
        >
          {theme === "night" ? "ערב טוב!" : "בוקר טוב!"}
        </h1>
      </div>

      <div className="flex gap-6 justify-center w-full z-10 px-4 shrink-0">
        {(Object.keys(kidsConfig) as KidId[]).map((kidId) => {
          const kid = kidsConfig[kidId];
          const isAnimating = animatingKid === kidId;
          const bgDropShadow = adjustColor(kid.colorA, kidId === "pelegi" ? -140 : -120);
          const OUTLINE = adjustColor(kid.colorA, -180);

          return (
            <div
              key={kidId}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => handleSelect(kidId)}
            >
              <div
                className={`w-[100px] h-[100px] rounded-full overflow-hidden transition-all duration-75 active:translate-y-[4px] relative ${
                  isAnimating ? "translate-y-[4px]" : ""
                }`}
                style={{
                  backgroundColor: "white",
                  boxShadow: isAnimating
                    ? `0px 0px 0px 0px ${bgDropShadow}, 0px 0px 0px 1.5px ${OUTLINE}, 0px 0px 0px 1.5px ${OUTLINE}`
                    : `0px 4px 0px 0px ${bgDropShadow}, 0px 4px 0px 1.5px ${OUTLINE}, 0px 0px 0px 1.5px ${OUTLINE}`,
                }}
              >
                <img
                  src={kid.profileImg}
                  alt={kid.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className={`mt-4 text-xl font-black tracking-tight flex items-center gap-1 transition-colors duration-200 ${theme === "night" ? "text-white/90" : "text-[#333]"}`}
                style={{ transitionDelay: theme === "night" ? "0ms" : "200ms" }}
              >
                {kid.name}
              </div>

              <div className="flex flex-col items-center min-h-[32px]">
                {!loading && stars[kidId] > 0 && (
                  <div className="mt-1 flex flex-row items-center justify-center gap-1 bg-white/30 backdrop-blur-[4px] px-2 py-0.5 rounded-full border border-white/20 mix-blend-overlay">
                    <div className="flex items-center gap-0.5">
                      {stars[kidId] <= 5 ? (
                        Array.from({ length: stars[kidId] }).map((_, i) => (
                          <svg
                            key={i}
                            viewBox="0 0 24 24"
                            className="w-3.5 h-3.5 shrink-0"
                          >
                            <path
                              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                              fill="#ffea92"
                              stroke="#000"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          </svg>
                        ))
                      ) : (
                        <div className="flex items-center gap-0.5 text-[#333]">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-3.5 h-3.5 shrink-0"
                          >
                            <path
                              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                              fill="#ffea92"
                              stroke="#000"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="text-[10px] font-black mt-[1px]">
                            ×
                          </span>
                          <span className="text-[10px] font-black">
                            {stars[kidId]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col justify-center items-center z-10 w-full">
        <ThemeSwitch />
      </div>
    </motion.div>
  );
}
