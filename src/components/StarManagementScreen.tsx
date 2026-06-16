import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, Plus, Minus } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getKids } from '../constants';
import { KidId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onBack: () => void;
}

export default function StarManagementScreen({ onBack }: Props) {
  const { stars, updateStar } = useUser();
  const { theme: appTheme } = useTheme();
  const { t, language } = useLanguage();
  const kidsConfig = getKids(appTheme, language);

  const handleUpdate = async (kidId: KidId, delta: number) => {
    const newCount = Math.max(0, (stars[kidId] || 0) + delta);
    await updateStar(kidId, newCount);
  };

  const textColor = appTheme === 'night' ? 'text-white' : 'text-[#333]';
  const panelBg = appTheme === 'night' ? 'bg-white/10 border-white/20' : 'bg-white/80 border-[#333]/10 text-[#333] backdrop-blur-sm';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`absolute inset-0 z-50 flex flex-col font-sans select-none overflow-hidden ${textColor}`}
      style={{ 
        background: appTheme === 'night' 
          ? 'linear-gradient(to bottom, #0a0f2b 0%, #462e5b 100%)' 
          : 'linear-gradient(to bottom, #e2f4f8 0%, #fee1e0 50%, #fffef0 100%)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-6 shrink-0 z-10 border-b border-black/5 dark:border-white/5">
        <h2 className={`text-2xl font-bold ${textColor}`}>{t('starManagement')}</h2>
        <motion.button 
          onClick={onBack} 
          className={`w-12 h-12 rounded-full flex items-center justify-center border-[1.5px] ${appTheme === 'night' ? 'bg-[#4a3b69] border-[#2d2242] text-white shadow-[0_4px_0_0_#2d2242]' : 'bg-white border-[#d1d5db] text-[#333] shadow-[0_4px_0_0_#d1d5db]'} active:translate-y-[4px] active:shadow-none transition-all cursor-pointer z-10`}
        >
          {language === 'he' ? <ChevronRight size={28} strokeWidth={2.5} /> : <ChevronLeft size={28} strokeWidth={2.5} />}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-md mx-auto flex flex-col p-4 gap-4 hide-scrollbar">
        {(Object.keys(kidsConfig) as KidId[]).map(kidId => {
          const kid = kidsConfig[kidId];
          const starCount = stars[kidId] || 0;
          return (
            <div key={kidId} className={`relative flex items-center justify-between rounded-2xl p-3 sm:p-4 border ${panelBg}`}>
              <div className="flex items-center gap-2 sm:gap-3 overflow-hidden w-1/3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-black/10 dark:border-white/20 bg-gray-100 flex-shrink-0">
                  <img src={kid.profileImg} alt={kid.name} className="w-full h-full object-cover" />
                </div>
                <span className={`font-bold text-lg sm:text-xl truncate ${textColor}`}>{kid.name}</span>
              </div>
              
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                <span className={`font-black flex items-center justify-center gap-1 text-base px-3 py-1 rounded-full w-[70px] sm:w-[80px] border shadow-[0_2px_0_0_rgba(0,0,0,0.1)] ${appTheme === 'night' ? 'text-[#ffbc00] bg-white/10 border-[#ffbc00]/30' : 'text-[#333] bg-white/80 border-black/10'}`}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 -ms-1"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#ffbc00" stroke="#000" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/></svg>
                  {starCount}
                </span>
              </div>
              
              <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3">
                <button
                  onClick={() => handleUpdate(kidId, -1)}
                  className={`w-12 h-12 rounded-full ${appTheme === 'night' ? 'bg-[#4a3b69]' : 'bg-white'} flex items-center justify-center border-none transition-all cursor-pointer`}
                  style={{
                    boxShadow: `0 4px 0 0 ${appTheme === 'night' ? '#2d2242' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`
                  }}
                  onPointerDown={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'translateY(4px)'; }}
                  onPointerUp={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? '#2d2242' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                  onPointerLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? '#2d2242' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                >
                  <Minus size={24} strokeWidth={2.5} className={appTheme === 'night' ? 'text-white' : 'text-[#333]'} />
                </button>
                <button
                  onClick={() => handleUpdate(kidId, 1)}
                  className={`w-12 h-12 rounded-full ${appTheme === 'night' ? 'bg-[#4a3b69]' : 'bg-white'} flex items-center justify-center border-none transition-all cursor-pointer`}
                  style={{
                    boxShadow: `0 4px 0 0 ${appTheme === 'night' ? '#2d2242' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`
                  }}
                  onPointerDown={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'translateY(4px)'; }}
                  onPointerUp={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? '#2d2242' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                  onPointerLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? '#2d2242' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                >
                  <Plus size={24} strokeWidth={2.5} className={appTheme === 'night' ? 'text-white' : 'text-[#333]'} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
