import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'he' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  he: {
    hello: "היי",
    goodMorning: "בוקר טוב",
    goodNight: "לילה טוב",
    stars: "כוכבים",
    parentMode: "התחברות פרופיל",
    settings: "הגדרות",
    starManagement: "ניהול כוכבים",
    doneBaby: "כל הכבוד חמודה!", 
    doneTiger: "איזה אלוף!", 
    doneBig: "גדול!", 
    menu: "תפריט",
    languageSwitcher: "English",
    // custom settings
    editTasks: "עריכת משימות",
    addCustomTask: "הוסף משימה מותאמת",
    removeTask: "הסר",
    close: "סגור",
    save: "שמור",
    toggleOn: "פעיל",
    toggleOff: "כבוי",
    profileSetup: "התחבר",
    loginParent: "הורה",
    loginChild: "ילד",
    noCustomAllowed: "מקסימום 10 משימות",
    taskNamePlaceholder: "שם המשימה",
  },
  en: {
    hello: "Hi",
    goodMorning: "Good Morning",
    goodNight: "Good Night",
    stars: "Stars",
    parentMode: "Profile / Login",
    settings: "Settings",
    starManagement: "Manage Stars",
    doneBaby: "Way to go sweetie!", 
    doneTiger: "What a champ!", 
    doneBig: "Awesome!",
    menu: "Menu",
    languageSwitcher: "עברית",
    // custom settings
    editTasks: "Edit Tasks",
    addCustomTask: "Add Custom Task",
    removeTask: "Remove",
    close: "Close",
    save: "Save",
    toggleOn: "On",
    toggleOff: "Off",
    profileSetup: "Login",
    loginParent: "Parent",
    loginChild: "Child",
    noCustomAllowed: "Max 10 tasks allowed",
    taskNamePlaceholder: "Task Name",
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('he');

  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language;
    if (saved === 'en' || saved === 'he') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('app_language', lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
