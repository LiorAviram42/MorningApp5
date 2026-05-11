import React, { createContext, useContext, useState, useEffect } from 'react';
import SunCalc from 'suncalc';

export type Theme = 'day' | 'night';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const ISRAEL_LAT = 32.0853;
const ISRAEL_LNG = 34.7818;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('day');

  useEffect(() => {
    const determineTheme = () => {
      const now = new Date();
      const options = { timeZone: 'Asia/Jerusalem', timeZoneName: 'short' as const };
      const tzString = now.toLocaleTimeString('en-US', options); 
      const isSummerTime = tzString.includes('IDT');

      const times = SunCalc.getTimes(now, ISRAEL_LAT, ISRAEL_LNG);
      let nightModeStart = times.sunset.getTime();
      
      if (isSummerTime) {
        nightModeStart -= 60 * 60 * 1000; // 1 hour before sunset in summer
      }
      
      const currentTime = now.getTime();
      const isNight = currentTime >= nightModeStart || currentTime < times.sunrise.getTime();
      
      return isNight ? 'night' : 'day';
    };

    const applyTheme = () => {
      const currentAutoTheme = determineTheme();
      const lastAutoTheme = localStorage.getItem('lastAutoTheme');
      const isOverridden = localStorage.getItem('themeOverrideActive') === 'true';
      const saved = localStorage.getItem('theme') as Theme | null;
      
      // If the automatic theme has changed (e.g., we crossed sunrise or sunset),
      // we should clear the manual override so the app behaves automatically again.
      if (lastAutoTheme && currentAutoTheme !== lastAutoTheme) {
        localStorage.removeItem('themeOverrideActive');
        localStorage.setItem('lastAutoTheme', currentAutoTheme);
        setThemeState(currentAutoTheme);
        return;
      }
      
      localStorage.setItem('lastAutoTheme', currentAutoTheme);

      if (isOverridden && (saved === 'day' || saved === 'night')) {
        setThemeState(saved);
      } else {
        setThemeState(currentAutoTheme);
      }
    };

    applyTheme();

    // Re-evaluate every 5 minutes
    const interval = setInterval(applyTheme, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('themeOverrideActive', 'true');
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'day' ? 'night' : 'day');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
