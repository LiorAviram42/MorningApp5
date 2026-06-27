import React from 'react';
import { Settings, Star, Globe, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';

interface Props {
  onOpenSettings: () => void;
  onOpenStars: () => void;
}

export default function MainMenu({ onOpenSettings, onOpenStars }: Props) {
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { role, setRole } = useUser();

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  const handleLogout = () => {
    setRole(null);
  };

  const isNight = theme === 'night';
  const textColor = isNight ? 'text-white' : 'text-[#333]';
  const hoverBg = isNight ? 'hover:bg-white/10' : 'hover:bg-black/5';

  return (
    <div className={`w-full h-full flex flex-col pt-20 px-6 font-sans select-none`}>
      <div className="flex flex-col gap-4">
        {role === 'parent' && (
          <>
            <button 
              onClick={onOpenSettings}
              className={`flex items-center gap-4 py-4 px-2 rounded-2xl ${hoverBg} transition-colors text-start w-full group`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-current opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0 ${textColor}`}>
                <Settings size={20} strokeWidth={2.5} />
              </div>
              <span className={`text-base font-normal sm:text-lg ${textColor}`}>{t('settings')}</span>
            </button>

            <button 
              onClick={onOpenStars}
              className={`flex items-center gap-3 md:gap-4 py-4 px-2 rounded-2xl ${hoverBg} transition-colors text-start w-full group`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-current opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0 ${textColor}`}>
                <Star size={20} strokeWidth={2.5} />
              </div>
              <span className={`text-base font-normal sm:text-lg ${textColor}`}>{t('starManagement')}</span>
            </button>
          </>
        )}

        <button 
          onClick={handleLogout}
          className={`flex items-center gap-3 md:gap-4 py-4 px-2 rounded-2xl ${hoverBg} transition-colors text-start w-full group`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-current opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0 ${textColor}`}>
            <LogOut size={20} strokeWidth={2.5} />
          </div>
          <span className={`text-base font-normal sm:text-lg ${textColor}`}>{t('profileSetup')}</span>
        </button>

        {role === 'parent' && (
          <>
            <div className="h-px w-full bg-current opacity-10 my-2" style={{ color: isNight ? 'white' : '#333' }} />

            <button 
              onClick={toggleLanguage}
              className={`flex items-center gap-3 md:gap-4 py-4 px-2 rounded-2xl ${hoverBg} transition-colors text-start w-full group`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-current opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0 ${textColor}`}>
                <Globe size={20} strokeWidth={2.5} />
              </div>
              <span className={`text-base font-normal sm:text-lg ${textColor}`}>{language === 'he' ? 'English' : 'עברית'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
