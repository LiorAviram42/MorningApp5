import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const { theme } = useTheme();
  
  const splashImg = theme === 'night' 
    ? `/night/summer/SplashScreen_Summer_Dark.png` 
    : `/day/summer/splash_screen_summer_Day.png`;

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const bgColor = theme === 'night' ? '#0f173c' : '#f7efc8';

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ backgroundColor: bgColor }}
      onClick={onFinish}
      className="absolute inset-0 z-50 flex flex-col justify-center items-center cursor-pointer pointer-events-auto"
    >
      <img 
        src={splashImg} 
        alt="Splash" 
        className="w-full h-full object-cover z-10"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </motion.div>
  );
}
