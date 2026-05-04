/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import GameScreen from './components/GameScreen';
import InstallPrompt from './components/InstallPrompt';
import { KidId } from './types';
import { getKids } from './constants';
import { useUser, UserProvider } from './contexts/UserContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { resetKidTasks } = useUser();
  const { theme } = useTheme();
  const [screen, setScreen] = useState<'splash' | 'home' | 'game'>('splash');
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
  }, []);

  const handleBack = useCallback(() => {
    console.log("handleBack called");
    setScreen('home');
  }, []);

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (screen === 'splash') {
      if (metaThemeColor) metaThemeColor.setAttribute('content', theme === 'night' ? '#0f173c' : '#c0e2eb');
    } else {
      if (metaThemeColor) metaThemeColor.setAttribute('content', theme === 'night' ? '#0f173c' : '#C5E9F1');
    }
  }, [screen, theme]);

  return (
    <div 
      dir="rtl" 
      className="w-full h-full min-h-[100dvh] max-w-md mx-auto relative overflow-hidden flex flex-col font-sans select-none"
    >
      {/* Background layer: Day */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none"
        style={{ 
          background: screen === 'splash' ? '#f7efc8' : 'linear-gradient(to bottom, #C5E9F1 0%, #FDC4C1 50%, #FFFDE1 100%)',
          opacity: theme === 'night' ? 0 : 1
        }} 
      />
      {/* Background layer: Night */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none"
        style={{ 
          background: screen === 'splash' ? '#0f173c' : 'linear-gradient(to bottom, #0f173c 0%, #553870 100%)',
          opacity: theme === 'night' ? 1 : 0
        }} 
      />
      
      {/* App content layer */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-auto">
        {screen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}
        {screen === 'home' && <HomeScreen onSelectKid={handleKidSelect} hasMagicBg={false} />}
        {screen === 'game' && selectedKid && (
          <GameScreen kidId={selectedKid} onBack={handleBack} />
        )}
        <InstallPrompt />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
