
import React from 'react';
import { Player, PlayerStatus, GamePhase } from '../types';
import CardUI from './CardUI';
import { getHandCategory } from '../utils/gameLogic';

interface PlayerSlotProps {
  player: Player;
  isCurrentTurn: boolean;
  isWinner: boolean;
  showCards: boolean; 
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({ player, isCurrentTurn, isWinner, showCards }) => {
  const isPacked = player.status === PlayerStatus.PACKED;
  const isWaiting = player.status === PlayerStatus.WAITING;
  
  const isRevealed = showCards || (player.id === '1' && player.isSeen);
  const shouldHide = !isRevealed;

  if (isWaiting) return null;

  const category = getHandCategory(player.cards);
  // Only show the bubble for named special hands, hide "X Pts"
  const isNamedHand = ['KORA', 'NAWAN', 'SIANG'].includes(category);
  const showBubble = isRevealed && !isPacked && isNamedHand;

  return (
    <div className={`relative flex flex-col items-center transition-all duration-300 ${isPacked ? 'opacity-40 grayscale-[0.8]' : 'opacity-100'}`}>
      
      {/* Cards Area */}
      <div className="flex -space-x-4 mb-3 h-16 md:h-22 relative z-10">
        {player.cards.map((card, idx) => (
          <CardUI 
            key={idx} 
            card={card} 
            hidden={shouldHide} 
            className={`shadow-lg border-2 transition-transform duration-300 ${isRevealed ? 'hover:-translate-y-1' : ''}`}
            style={{ 
              zIndex: idx,
              transform: `translateY(${idx === 1 ? '-4px' : '0px'})`
            }}
          />
        ))}

        {/* Category Bubble */}
        {showBubble && (
          <div className={`absolute -right-8 top-1/2 -translate-y-1/2 min-w-[32px] md:min-w-[48px] h-8 md:h-10 px-2 rounded-full border-2 border-slate-900 flex flex-col items-center justify-center shadow-xl z-20 animate-in zoom-in bg-amber-400`}>
             <span className={`text-[6px] md:text-[8px] font-black leading-none uppercase text-black`}>Hand</span>
             <span className={`text-[10px] md:text-xs font-black leading-none text-black`}>{category}</span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-1.5 pointer-events-none z-20">
        {isPacked ? (
           <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">PACKED</span>
        ) : player.isSeen ? (
           <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">SEEN</span>
        ) : (
           <span className="bg-slate-700 text-white px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">BLIND</span>
        )}
      </div>

      {/* Player Profile */}
      <div className={`relative px-3 py-1.5 rounded-xl border-2 transition-all duration-300 shadow-xl ${isCurrentTurn ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/20 scale-105 z-30' : 'bg-slate-900 border-slate-700'}`}>
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <img 
              src={player.avatar} 
              alt={player.name} 
              className={`w-8 h-8 md:w-11 md:h-11 rounded-full border border-white/10 object-cover bg-slate-800 shadow-sm ${isCurrentTurn ? 'border-amber-400' : 'border-slate-600'}`} 
            />
            {isCurrentTurn && !isPacked && (
              <div className="absolute -inset-1 border border-amber-400 border-dashed rounded-full animate-[spin_10s_linear_infinite]" />
            )}
          </div>
          <div className="flex flex-col min-w-[60px] md:min-w-[85px]">
            <span className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-tight truncate leading-tight">{player.name}</span>
            <span className="text-amber-400 text-[10px] md:text-[13px] font-mono font-black leading-none mt-0.5">Rs.{player.balance.toLocaleString()}</span>
            <div className="flex items-center gap-1 mt-1 border-t border-white/10 pt-1">
              <span className="text-[6px] md:text-[7px] font-black text-blue-400 uppercase">Stack</span>
              <span className="text-[7px] md:text-[9px] font-mono font-black text-blue-300 leading-none">Rs.{player.currentBet.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {isWinner && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-3 py-0.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest shadow-2xl animate-bounce whitespace-nowrap border border-white/20 z-40">
            WIN 🏆
          </div>
        )}
      </div>

    </div>
  );
};

export default PlayerSlot;
