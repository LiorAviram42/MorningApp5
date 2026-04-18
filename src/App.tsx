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
import { KIDS } from './constants';
import { useUser, UserProvider } from './contexts/UserContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { resetKidTasks } = useUser();
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

  useEffect(() => {
    const checkDailyReset = async () => {
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem('appDate');
      
      if (savedDate !== today) {
        // Reset Supabase tasks for everyone
        for (const kidId of Object.keys(KIDS) as KidId[]) {
          await resetKidTasks(kidId);
        }
        localStorage.setItem('appDate', today);
      }
    };
    
    checkDailyReset();
  }, [resetKidTasks]);

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
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#c0e2eb');
    } else {
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#C5E9F1');
    }
  }, [screen]);

  const backgroundStyle = screen === 'splash' 
    ? { backgroundColor: '#f7efc8' }
    : { background: 'linear-gradient(to bottom, #C5E9F1 0%, #FDC4C1 50%, #FFFDE1 100%)' };

  return (
    <div 
      dir="rtl" 
      className="w-full h-full min-h-[100dvh] max-w-md mx-auto relative overflow-hidden flex flex-col font-sans select-none transition-all duration-500"
      style={backgroundStyle}
    >
      {screen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}
      {screen === 'home' && <HomeScreen onSelectKid={handleKidSelect} hasMagicBg={false} />}
      {screen === 'game' && selectedKid && (
        <GameScreen kidId={selectedKid} onBack={handleBack} />
      )}
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ErrorBoundary>
  );
}
