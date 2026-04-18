import React, { useState, useEffect } from 'react';
import { KIDS } from '../constants';
import { KidId } from '../types';
import { sounds, safeVibrate } from '../utils/sounds';
import { useUser } from '../contexts/UserContext';

interface Props {
  onSelectKid: (kidId: KidId) => void;
  hasMagicBg?: boolean;
}

export default function HomeScreen({ onSelectKid }: Props) {
  const { role, stars, loading } = useUser();
  const [animatingKid, setAnimatingKid] = useState<KidId | null>(null);

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#C5E9F1');
  }, []);

  const handleSelect = (kidId: KidId) => {
    safeVibrate(5);
    sounds.playSelect();
    setAnimatingKid(kidId);
    setTimeout(() => {
      onSelectKid(kidId);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center h-full w-full relative overflow-hidden box-border pb-24">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="flex-1 flex flex-col justify-center z-10 w-full">
        <h1 className="text-5xl font-bold text-[#333] text-center drop-shadow-sm">בוקר טוב!</h1>
      </div>
      
      <div className="flex gap-6 justify-center w-full z-10 px-4 shrink-0">
        {(Object.keys(KIDS) as KidId[]).map((kidId) => {
          const kid = KIDS[kidId];
          const isAnimating = animatingKid === kidId;
          
          return (
            <div 
              key={kidId} 
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => handleSelect(kidId)}
            >
              <div 
                className={`w-[100px] h-[100px] rounded-full border border-[#333] bg-white overflow-hidden shadow-[0px_4px_0px_#333] transition-all duration-75 active:translate-y-[4px] active:shadow-none relative ${isAnimating ? 'translate-y-[4px] shadow-none' : ''}`}
              >
                <img 
                  src={kid.profileImg} 
                  alt={kid.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${kid.name}&backgroundColor=b6e3f4`;
                  }}
                />
              </div>
              <div className="mt-4 text-xl font-black text-[#333] tracking-tight flex items-center gap-1">
                {kid.name}
              </div>
              
              <div className="flex flex-col items-center min-h-[32px]">
                {!loading && stars[kidId] > 0 && (
                  <div className="mt-1 flex flex-row items-center justify-center gap-1 bg-white/30 backdrop-blur-[4px] px-2 py-0.5 rounded-full border border-white/20 mix-blend-overlay">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: Math.min(stars[kidId], 5) }).map((_, i) => (
                        <svg key={i} viewBox="0 0 24 24" className="w-3.5 h-3.5">
                          <path 
                            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                            fill="#ffea92"
                            stroke="#000"
                            strokeWidth="1.2"
                          />
                        </svg>
                      ))}
                      {stars[kidId] > 5 && <span className="text-[9px] font-black text-[#333]/70 ml-0.5">+{stars[kidId] - 5}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col justify-center z-10 w-full">
        <h2 className="text-[#333] text-2xl font-black tracking-tight text-center">
          מוכנים? קדימה לדרך!
        </h2>
      </div>
    </div>
  );
}
