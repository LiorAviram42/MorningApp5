import React, { useRef, useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  max: number;
}

export default function DigitWheel({ value, onChange, max }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<any>(null);

  const isCircular = max === 60;
  const sets = isCircular ? 3 : 1;
  const offset = isCircular ? max : 0;

  useEffect(() => {
    if (!isScrolling && containerRef.current) {
      const numVal = parseInt(value, 10);
      const targetIndex = numVal + offset;
      
      const container = containerRef.current;
      const targetElement = container.children[targetIndex] as HTMLElement;
      if (targetElement) {
        const targetTop = targetElement.offsetTop;
        const currentTop = container.scrollTop;
        if (Math.abs(currentTop - targetTop) > targetElement.clientHeight) {
          container.scrollTo({ top: targetTop, behavior: 'auto' });
        } else {
          container.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      }
    }
  }, [value, isScrolling, offset]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    setIsScrolling(true);
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
      const container = containerRef.current;
      if (!container) return;
      
      let closest = null;
      let minDiff = Infinity;
      const containerCenter = container.scrollTop + container.clientHeight / 2;
      
      for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLElement;
        const childCenter = child.offsetTop + child.clientHeight / 2;
        const diff = Math.abs(containerCenter - childCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      }
      
      if (closest !== null) {
        const adjustedVal = closest % max;
        onChange(adjustedVal.toString());
        
        // Seamless wrap around if too close to edges
        if (isCircular) {
          if (closest < max || closest >= max * 2) {
             const middleIndex = max + adjustedVal;
             const targetElement = container.children[middleIndex] as HTMLElement;
             if (targetElement) {
               container.scrollTo({ top: targetElement.offsetTop, behavior: 'auto' });
             }
          }
        }
      }
    }, 150);
  };

  return (
    <div className="relative w-14 h-14 sm:w-16 sm:h-16 border-2 border-[#333] bg-white rounded-xl overflow-hidden box-border">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory touch-pan-y hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        
        {Array.from({ length: max * sets }).map((_, i) => (
          <div key={i} className="w-full h-full flex items-center justify-center snap-center text-3xl font-bold text-[#333] shrink-0 box-border">
            {(i % max).toString().padStart(2, '0')}
          </div>
        ))}
      </div>
    </div>
  );
}
