
import React from 'react';
import { Card } from '../types';
import { getSuitIcon, getSuitColor } from '../utils/gameLogic';

interface CardUIProps {
  card?: Card;
  hidden?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const CardUI: React.FC<CardUIProps> = ({ card, hidden, className = '', style }) => {
  const baseClasses = "w-12 h-18 md:w-20 md:h-28 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.6)] border-[2.5px] transition-all duration-300 select-none overflow-hidden relative";

  if (hidden || !card) {
    return (
      <div 
        style={style}
        className={`${baseClasses} bg-gradient-to-br from-[#801010] via-[#b91c1c] to-[#801010] border-amber-500/70 flex items-center justify-center ${className}`}
      >
        <div className="w-[88%] h-[88%] border-[1.5px] border-amber-400/40 rounded-lg flex items-center justify-center bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.2)_0px,rgba(0,0,0,0.2)_1px,transparent_1px,transparent_5px)] shadow-inner">
           <div className="text-[9px] md:text-[12px] font-cinzel text-amber-500/90 rotate-[-45deg] font-black tracking-widest">NAWAN</div>
        </div>
      </div>
    );
  }

  const colorClass = getSuitColor(card.suit);
  const icon = getSuitIcon(card.suit);

  return (
    <div 
      style={style}
      className={`${baseClasses} bg-white border-slate-400 flex flex-col p-2 md:p-3 ${className}`}
    >
      {/* Top Corner */}
      <div className={`flex flex-col leading-none items-start z-10`}>
        <span className={`text-[13px] md:text-[20px] font-black ${colorClass}`}>{card.value}</span>
        <span className={`text-[10px] md:text-[15px] ${colorClass}`}>{icon}</span>
      </div>
      
      {/* Centerpiece */}
      <div className="flex-grow flex items-center justify-center z-10">
        <span className={`text-3xl md:text-6xl ${colorClass} drop-shadow-md`}>{icon}</span>
      </div>
      
      {/* Bottom Corner (Inverted) */}
      <div className={`flex flex-col leading-none items-end rotate-180 z-10`}>
        <span className={`text-[13px] md:text-[20px] font-black ${colorClass}`}>{card.value}</span>
        <span className={`text-[10px] md:text-[15px] ${colorClass}`}>{icon}</span>
      </div>

      {/* Surface Texture/Shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-white/20 to-transparent pointer-events-none z-0"></div>
    </div>
  );
};

export default CardUI;
