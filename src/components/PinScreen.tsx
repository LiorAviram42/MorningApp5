import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { safeVibrate, sounds } from '../utils/sounds';
import { Check } from 'lucide-react';

interface Props {
  onLogin: (role: 'parent' | 'child') => void;
}

export default function PinScreen({ onLogin }: Props) {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (pin === '1234') {
      safeVibrate(5);
      sounds.playSuccess();
      setStatus('success');
      setTimeout(() => onLogin('parent'), 500);
    } else if (pin === '0000') {
      safeVibrate(5);
      sounds.playSuccess();
      setStatus('success');
      setTimeout(() => onLogin('child'), 500);
    } else {
      safeVibrate([10, 50, 10]); // Error vibration pattern
      sounds.playBack(); // Play error-like feedback sound
      setStatus('error');
      setTimeout(() => {
        setPin('');
        setStatus('idle');
        inputRef.current?.focus();
      }, 800);
    }
  };

  const getButtonClass = () => {
    if (status === 'success') return 'bg-[#d0f4de] border-[#333] text-[#333]';
    if (status === 'error') return 'bg-red-400 border-[#333] text-white';
    return 'bg-[#f8f9fa] border-[#333] text-[#333]/50';
  };

  const getInputClass = () => {
    if (status === 'success') return 'bg-[#d0f4de]/30 border-[#d0f4de] text-[#333]';
    if (status === 'error') return 'bg-red-100 border-red-400 text-red-600';
    return 'bg-white focus:bg-[#fdfdfd] text-[#333] border-[#333]';
  };

  return (
    <div 
      dir="rtl"
      className="flex flex-col items-center justify-center h-[100dvh] w-full font-sans relative overflow-hidden box-border p-4"
      style={{ background: 'linear-gradient(to bottom, #C5E9F1 0%, #FDC4C1 50%, #FFFDE1 100%)' }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-[90%] max-w-[320px] bg-white/75 backdrop-blur-md rounded-3xl border-2 border-[#333] shadow-[0_8px_0_#333] p-5 md:p-6 flex flex-col items-center relative z-10 box-border mx-auto"
      >
        <h1 className="text-xl md:text-2xl font-bold text-[#333] mb-5 text-center">מי נכנס?</h1>

        <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full justify-center box-border">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setStatus('idle');
            }}
            className={`min-w-0 flex-1 px-2 h-14 text-center text-2xl font-bold tracking-[0.3em] rounded-2xl border-2 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] transition-colors appearance-none ${getInputClass()}`}
            placeholder="קוד"
            autoFocus
          />
          
          <button
            type="submit"
            className={`w-14 h-14 shrink-0 border-2 shadow-[0_4px_0_#333] rounded-full active:translate-y-[4px] active:shadow-none active:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${getButtonClass()}`}
          >
            <Check size={28} strokeWidth={3} />
          </button>
        </form>

        <div className="h-8 mt-3 flex items-center justify-center w-full">
          {status === 'error' && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-red-500 font-bold text-sm text-center m-0"
            >
              קוד שגוי, נסו שוב
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
