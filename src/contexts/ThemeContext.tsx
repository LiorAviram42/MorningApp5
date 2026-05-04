import React, { createContext, useContext, useState, useEffect } from 'react';

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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('day');

  useEffect(() => {
    // Check local storage first
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved === 'day' || saved === 'night') {
      setThemeState(saved);
      return;
    }

    // Default to system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setThemeState(mediaQuery.matches ? 'night' : 'day');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only change if user hasn't overridden
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'night' : 'day');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
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
