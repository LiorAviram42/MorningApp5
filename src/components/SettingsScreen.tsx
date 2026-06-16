import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, Plus, Minus, Check } from 'lucide-react';
import { useUser, KidSettings } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getKids, getTasksForKid } from '../constants';
import { KidId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { adjustColor } from '../utils/colors';

interface Props {
  onBack: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'Medicine.svg', label: 'Medicine' },
  { id: 'Teeth.svg', label: 'Teeth' },
  { id: 'Shower.svg', label: 'Shower' },
  { id: 'Toilet.svg', label: 'Toilet' },
  { id: 'Clothes.svg', label: 'Clothes' },
  { id: 'Bag.svg', label: 'Bag' },
  { id: 'Breakfast.svg', label: 'Food' },
];

export default function SettingsScreen({ onBack }: Props) {
  const { settings, updateSettings } = useUser();
  const { theme: appTheme } = useTheme();
  const { t, language } = useLanguage();
  
  const [editingTheme, setEditingTheme] = useState<'day' | 'night'>(appTheme);
  
  const kidsConfig = getKids(editingTheme, language);
  const kidsIds = Object.keys(kidsConfig) as KidId[];
  const [selectedKid, setSelectedKid] = useState<KidId>(kidsIds[0]);

  const currentSettings = settings[selectedKid] || { hiddenTasks: [], customTasks: [] };
  const allBuiltInTasks = getTasksForKid(selectedKid, editingTheme, language);
  // Filter for custom tasks created for this theme, or tasks created before theme was added (fallback to day)
  const filteredCustomTasks = currentSettings.customTasks.filter(t => t.theme === editingTheme || (!t.theme && editingTheme === 'day'));

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskIcon, setNewTaskIcon] = useState('Medicine.svg');

  const MAX_TASKS = 10;
  const currentTotal = allBuiltInTasks.filter(t => !currentSettings.hiddenTasks.includes(t.id)).length + filteredCustomTasks.length;

  const toggleTaskVisibility = (taskId: string) => {
    const isHidden = currentSettings.hiddenTasks.includes(taskId);
    let newHidden = [...currentSettings.hiddenTasks];
    if (isHidden) {
      newHidden = newHidden.filter(id => id !== taskId);
    } else {
      newHidden.push(taskId);
    }
    updateSettings(selectedKid, { ...currentSettings, hiddenTasks: newHidden });
  };

  const removeCustomTask = (taskId: string) => {
    updateSettings(selectedKid, {
      ...currentSettings,
      customTasks: currentSettings.customTasks.filter(t => t.id !== taskId)
    });
  };

  const addCustomTask = () => {
    if (currentTotal >= MAX_TASKS || !newTaskTitle.trim()) return;
    
    const newId = `custom_${Date.now()}`;
    const newTask = {
      id: newId,
      title: newTaskTitle.trim(),
      iconName: newTaskIcon,
      theme: editingTheme
    };

    updateSettings(selectedKid, {
      ...currentSettings,
      customTasks: [...currentSettings.customTasks, newTask]
    });

    setNewTaskTitle('');
    setIsAdding(false);
  };

  const renderToggle = (isActive: boolean, onClick: () => void) => {
    const onBg = appTheme === 'night' ? 'bg-[#ae9cee]' : 'bg-[#fbc6cb]';
    const offBg = appTheme === 'night' ? 'bg-[#4a3b69]/40' : 'bg-black/10';
    const trackBorderColor = appTheme === 'night' ? '#111' : '#333';
    const solidContainerShadow = appTheme === 'night' ? 'inset 0 3px 0 0 rgba(0,0,0,0.4)' : 'inset 0 3px 0 0 rgba(0,0,0,0.1)';
    const thumbShadowColor = appTheme === 'night' ? 'rgba(255,255,255,0.3)' : '#d1d5db';
    
    return (
      <button
        onClick={onClick}
        className={`relative w-[60px] h-[36px] rounded-full transition-colors duration-200 box-border shrink-0 border-[1.5px] overflow-hidden ${isActive ? onBg : offBg}`}
        style={{ WebkitTapHighlightColor: 'transparent', borderColor: trackBorderColor, boxShadow: solidContainerShadow }}
      >
        <div 
          className="absolute rounded-full bg-white transition-all duration-300"
          style={{ 
            top: '0px', 
            height: '33px',
            width: '33px',
            boxShadow: `0 3px 0 0 ${thumbShadowColor}, 0 0 0 1.5px ${trackBorderColor}, 0 3px 0 1.5px ${trackBorderColor}`,
            [language === 'he' ? 'right' : 'left']: isActive ? 'calc(100% - 33px)' : '0px',
          }}
        />
      </button>
    );
  };

  const textColor = appTheme === 'night' ? 'text-white' : 'text-[#333]';
  const panelBg = appTheme === 'night' ? 'bg-white/10 text-white' : 'bg-white/80 text-[#333] backdrop-blur-sm';
  const panelBorder = appTheme === 'night' ? 'border-[#111]' : 'border-[#333]';
  const borderColor = appTheme === 'night' ? 'border-[#333]' : 'border-[#333]';

  // For icons: "אם האפליקציה עצמה על מצב יום (הרקע הבהיר) האייקונים מוצגים בשחור... אם לילה כל האייקונים יופיעו לבן"
  const iconFilterClass = appTheme === 'night' ? 'filter brightness-0 invert' : 'filter brightness-0';

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
      <div className="flex items-center justify-between px-6 pt-12 pb-6 shrink-0 z-10">
        <h2 className={`text-2xl font-bold ${textColor}`}>{t('editTasks')}</h2>
        <motion.button 
          onClick={onBack} 
          className={`w-12 h-12 rounded-full flex items-center justify-center border-none transition-all cursor-pointer z-10 ${appTheme === 'night' ? 'text-white' : 'text-[#333]'}`}
          style={{
            backgroundColor: appTheme === 'night' ? '#4a3b69' : '#ffffff',
            boxShadow: `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`
          }}
          onPointerDown={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'translateY(4px)'; }}
          onPointerUp={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
          onPointerLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
        >
          {language === 'he' ? <ChevronRight size={28} strokeWidth={2.5} /> : <ChevronLeft size={28} strokeWidth={2.5} />}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto w-full flex flex-col hide-scrollbar px-4">
        {/* Day/Night Tabs - Color uniform as requested ("שיהיו באותו צבע") */}
        <div className="flex gap-2 shrink-0 mb-6 border-b border-black/5 pb-6">
          <button
            onClick={() => setEditingTheme('day')}
            className={`flex-1 py-3 rounded-full font-bold border-[1.5px] transition-all`}
            style={{
              backgroundColor: editingTheme === 'day' ? (appTheme === 'night' ? '#4a3b69' : '#ffffff') : 'transparent',
              color: editingTheme === 'day' ? (appTheme === 'night' ? '#ffffff' : '#333333') : (appTheme === 'night' ? '#ffffff' : '#333333'),
              borderColor: appTheme === 'night' ? '#111' : '#333',
              opacity: editingTheme === 'day' ? 1 : 0.5
            }}
          >
            {language === 'he' ? 'יום' : 'Day'}
          </button>
          <button
            onClick={() => setEditingTheme('night')}
            className={`flex-1 py-3 rounded-full font-bold border-[1.5px] transition-all`}
            style={{
              backgroundColor: editingTheme === 'night' ? (appTheme === 'night' ? '#4a3b69' : '#ffffff') : 'transparent',
              color: editingTheme === 'night' ? (appTheme === 'night' ? '#ffffff' : '#333333') : (appTheme === 'night' ? '#ffffff' : '#333333'),
              borderColor: appTheme === 'night' ? '#111' : '#333',
              opacity: editingTheme === 'night' ? 1 : 0.5
            }}
          >
            {language === 'he' ? 'לילה' : 'Night'}
          </button>
        </div>

        {/* Kids Tabs - Ellipse shape, NO VOLUME, subtle outline */}
        <div className="flex gap-2 pb-2 shrink-0 overflow-x-auto hide-scrollbar mb-4">
          {kidsIds.map(kidId => {
            const isSelected = selectedKid === kidId;
            return (
              <button
                key={kidId}
                onClick={() => setSelectedKid(kidId)}
                className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-colors border-2 ${
                  isSelected 
                    ? `bg-[#fcf9f2] text-[#333] border-[#333]` // the kids buttons inside here stay dark text because they have a light background selected
                    : 'bg-transparent border-transparent text-current opacity-50'
                }`}
                style={isSelected && appTheme === 'night' ? { borderColor: 'white', backgroundColor: 'transparent', color: 'white' } : {}}
              >
                {kidsConfig[kidId].name}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3">
          {allBuiltInTasks.map(task => {
            const isActive = !currentSettings.hiddenTasks.includes(task.id);
            return (
              <div key={task.id} className={`flex items-center justify-between rounded-2xl p-4 border-[1.5px] ${panelBorder} ${panelBg}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img src={task.iconOn} alt="" className={`max-w-full max-h-full ${iconFilterClass}`} />
                  </div>
                  <span className={`font-bold ${textColor}`}>{task.title}</span>
                </div>
                {renderToggle(isActive, () => toggleTaskVisibility(task.id))}
              </div>
            );
          })}

          {filteredCustomTasks.map(task => (
            <div key={task.id} className={`flex items-center justify-between rounded-2xl p-4 border-[1.5px] ${panelBorder} ${panelBg}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src={`/Icons_Vector/${task.iconName}`} alt="" className={`max-w-full max-h-full ${iconFilterClass}`} />
                </div>
                <span className={`font-bold ${textColor}`}>{task.title}</span>
              </div>
              {/* Inset shadow minus button */}
              <button
                onClick={() => removeCustomTask(task.id)}
                className={`w-10 h-10 rounded-full bg-white flex items-center justify-center border-none transition-all cursor-pointer`}
                style={{
                  boxShadow: `0 3px 0 0 ${appTheme === 'night' ? 'rgba(255,255,255,0.3)' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 3px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`
                }}
                onPointerDown={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'translateY(3px)'; }}
                onPointerUp={(e) => { e.currentTarget.style.boxShadow = `0 3px 0 0 ${appTheme === 'night' ? 'rgba(255,255,255,0.3)' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 3px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                onPointerLeave={(e) => { e.currentTarget.style.boxShadow = `0 3px 0 0 ${appTheme === 'night' ? 'rgba(255,255,255,0.3)' : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 3px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
              >
                <Minus size={20} strokeWidth={2.5} className="text-[#333]" />
              </button>
            </div>
          ))}

          {isAdding ? (
            <div className={`rounded-2xl p-4 border-[1.5px] ${panelBorder} ${panelBg} flex flex-col gap-4 mt-2`}>
              <input
                type="text"
                placeholder={t('taskNamePlaceholder')}
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className={`w-full bg-black/5 border-2 border-transparent rounded-xl px-4 py-3 font-bold outline-none focus:border-[#333] dark:focus:border-white transition-colors ${textColor}`}
                maxLength={20}
              />
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {AVAILABLE_ICONS.map(icon => (
                  <button
                    key={icon.id}
                    onClick={() => setNewTaskIcon(icon.id)}
                    className={`w-12 h-12 shrink-0 rounded-xl border-2 flex items-center justify-center transition-colors ${
                      newTaskIcon === icon.id ? 'border-current bg-black/5 dark:bg-white/10' : 'border-transparent opacity-50 hover:bg-black/5'
                    }`}
                  >
                    <img src={`/Icons_Vector/${icon.id}`} alt="" className={`w-8 h-8 ${iconFilterClass}`} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className={`flex-1 py-3 px-2 rounded-xl font-bold border-none flex items-center justify-center transition-all cursor-pointer ${appTheme === 'night' ? 'text-white' : 'text-[#333]'}`}
                  style={{
                    backgroundColor: appTheme === 'night' ? '#4a3b69' : '#f3f4f6',
                    boxShadow: `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`
                  }}
                  onPointerDown={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'translateY(4px)'; }}
                  onPointerUp={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                  onPointerLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                >
                  {t('close')}
                </button>
                <button
                  disabled={!newTaskTitle.trim()}
                  onClick={addCustomTask}
                  className={`flex-1 py-3 px-2 rounded-xl font-bold border-none flex items-center justify-center transition-all cursor-pointer ${appTheme === 'night' ? 'text-white' : 'text-[#333]'} disabled:opacity-50`}
                  style={{
                    backgroundColor: appTheme === 'night' ? '#ae9cee' : '#bae1ff',
                    boxShadow: !newTaskTitle.trim() ? `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}` : `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#ae9cee', -20) : adjustColor('#bae1ff', -20)}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`
                  }}
                  onPointerDown={(e) => { if (!newTaskTitle.trim()) return; e.currentTarget.style.boxShadow = `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'translateY(4px)'; }}
                  onPointerUp={(e) => { if (!newTaskTitle.trim()) return; e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#ae9cee', -20) : adjustColor('#bae1ff', -20)}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                  onPointerLeave={(e) => { if (!newTaskTitle.trim()) return; e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#ae9cee', -20) : adjustColor('#bae1ff', -20)}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
                >
                  {t('save')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              disabled={currentTotal >= MAX_TASKS}
              className={`mt-2 w-full py-4 rounded-xl border-none font-bold flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer ${appTheme === 'night' ? 'text-white' : 'text-[#333]'}`}
              style={{
                backgroundColor: appTheme === 'night' ? 'rgba(74, 59, 105, 0.8)' : '#ffffff',
                boxShadow: currentTotal >= MAX_TASKS ? `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}` : `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`
              }}
              onPointerDown={(e) => { if (currentTotal >= MAX_TASKS) return; e.currentTarget.style.boxShadow = `0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'translateY(4px)'; }}
              onPointerUp={(e) => { if (currentTotal >= MAX_TASKS) return; e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
              onPointerLeave={(e) => { if (currentTotal >= MAX_TASKS) return; e.currentTarget.style.boxShadow = `0 4px 0 0 ${appTheme === 'night' ? adjustColor('#4a3b69', -20) : '#d1d5db'}, 0 0 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}, 0 4px 0 1.5px ${appTheme === 'night' ? '#111' : '#333'}`; e.currentTarget.style.transform = 'none'; }}
            >
              <Plus size={24} strokeWidth={2.5} />
              {currentTotal >= MAX_TASKS ? t('noCustomAllowed') : t('addCustomTask')}
            </button>
          )}
          <div className="h-8 shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
