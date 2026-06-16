/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import GameScreen from './components/GameScreen';
import InstallPrompt from './components/InstallPrompt';
import { KidId } from './types';
import { getKids } from './constants';
import { useUser, UserProvider } from './contexts/UserContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import SettingsScreen from './components/SettingsScreen';
import StarManagementScreen from './components/StarManagementScreen';
import MainMenu from './components/MainMenu';

function AppContent() {
  const { resetKidTasks, isMenuOpen, setIsMenuOpen } = useUser();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [screen, setScreen] = useState<'splash' | 'home' | 'game' | 'settings' | 'stars'>('splash');
  const [selectedKid, setSelectedKid] = useState<KidId | null>(null);

  useEffect(() => {
    console.log("App state changed:", { screen, selectedKid });
  }, [screen, selectedKid]);

  // Safety timer: If we're still on splash after 6 seconds, force home
  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        console.log("Safety timer triggered: forcing home screen");
        setScreen('home');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleSplashFinish = useCallback(() => {
    console.log("Splash finished, moving to home");
    setScreen('home');
  }, []);

  const handleKidSelect = useCallback((kidId: KidId) => {
    console.log("handleKidSelect called with:", kidId);
    setSelectedKid(kidId);
    setScreen('game');
    window.history.pushState({ screen: 'game', kidId }, '');
  }, []);

  const handleBack = useCallback(() => {
    console.log("handleBack called");
    if (window.history.state?.screen === 'game' || window.history.state?.screen === 'settings' || window.history.state?.screen === 'stars') {
      window.history.back(); // Triggers popstate which sets to home
    } else {
      setScreen('home');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setScreen(prev => {
        if (prev === 'game' || prev === 'settings' || prev === 'stars') return 'home';
        return prev;
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (screen === 'splash') {
      if (metaThemeColor) metaThemeColor.setAttribute('content', theme === 'night' ? '#0f173c' : '#c0e2eb');
    } else {
      if (metaThemeColor) metaThemeColor.setAttribute('content', theme === 'night' ? '#0f173c' : '#C5E9F1');
    }
  }, [screen, theme]);

  const openScreenFromMenu = (newScreen: 'settings' | 'stars') => {
    setIsMenuOpen(false);
    setScreen(newScreen);
    window.history.pushState({ screen: newScreen }, '');
  };

  const menuBgStyle = theme === 'night'
    ? { background: 'linear-gradient(to bottom, #1f2a5e 0%, #684985 100%)' }
    : { background: 'linear-gradient(to bottom, #e4f4f7 0%, #fee6e5 50%, #fffeee 100%)' };

  const appOutlineColor = 'rgba(0, 0, 0, 0.5)';
  const appVolumeColor = theme === 'night' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)';

  return (
    <div 
      dir={language === 'he' ? 'rtl' : 'ltr'} 
      className={`w-full max-w-full sm:max-w-md mx-auto relative overflow-hidden flex flex-col font-sans select-none min-h-[100dvh] h-[100dvh]`}
      style={menuBgStyle}
    >
      {/* Underlying Menu Layer */}
      <div className={`absolute top-0 bottom-0 ${language === 'he' ? 'right-0' : 'left-0'} w-[50%] z-0`}>
        <MainMenu onOpenSettings={() => openScreenFromMenu('settings')} onOpenStars={() => openScreenFromMenu('stars')} />
      </div>

      {/* Main Foreground Layer */}
      <motion.div 
        className="w-full h-full relative z-10 flex flex-col bg-black overflow-hidden"
        animate={{ 
          x: isMenuOpen ? (language === 'he' ? '-50%' : '50%') : '0%',
          borderRadius: isMenuOpen ? '28px' : '0px',
          boxShadow: isMenuOpen 
            ? (language === 'he' 
              ? `0 6px 0 0 ${appVolumeColor}, 0 0 0 1.5px ${appOutlineColor}, 0 6px 0 1.5px ${appOutlineColor}, 4px 6px 0 1.5px rgba(0,0,0,0.08), 8px 6px 0 1.5px rgba(0,0,0,0.05), 12px 6px 0 1.5px rgba(0,0,0,0.03), 16px 6px 0 1.5px rgba(0,0,0,0.02)` 
              : `0 6px 0 0 ${appVolumeColor}, 0 0 0 1.5px ${appOutlineColor}, 0 6px 0 1.5px ${appOutlineColor}, -4px 6px 0 1.5px rgba(0,0,0,0.08), -8px 6px 0 1.5px rgba(0,0,0,0.05), -12px 6px 0 1.5px rgba(0,0,0,0.03), -16px 6px 0 1.5px rgba(0,0,0,0.02)`) 
            : '0 0 0 0 rgba(0,0,0,0)'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Background layer: Day */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none rounded-[inherit]"
          style={{ 
            background: screen === 'splash' ? '#f7efc8' : 'linear-gradient(to bottom, #C5E9F1 0%, #FDC4C1 50%, #FFFDE1 100%)',
            opacity: theme === 'night' ? 0 : 1
          }} 
        />
        {/* Background layer: Night */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none rounded-[inherit]"
          style={{ 
            background: screen === 'splash' ? '#0f173c' : 'linear-gradient(to bottom, #0f173c 0%, #553870 100%)',
            opacity: theme === 'night' ? 1 : 0
          }} 
        />
        
        {/* App content layer */}
        <div className="relative z-10 w-full h-full flex flex-col pointer-events-auto overflow-hidden bg-transparent">
          <AnimatePresence>
            {screen === 'splash' && <SplashScreen key="splash" onFinish={handleSplashFinish} />}
            {screen === 'home' && <HomeScreen key="home" onSelectKid={handleKidSelect} hasMagicBg={false} />}
            {screen === 'game' && selectedKid && (
              <GameScreen key="game" kidId={selectedKid} onBack={handleBack} />
            )}
            {screen === 'settings' && (
              <SettingsScreen key="settings" onBack={handleBack} />
            )}
            {screen === 'stars' && (
              <StarManagementScreen key="stars" onBack={handleBack} />
            )}
          </AnimatePresence>
          <InstallPrompt />
        </div>
        
        {/* Overlay to catch clicks and close menu */}
        {isMenuOpen && (
          <div 
            className="absolute inset-0 z-50 cursor-pointer" 
            onClick={() => setIsMenuOpen(false)} 
          />
        )}
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <UserProvider>
            <AppContent />
          </UserProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
