
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, GameState, GamePhase, PlayerStatus } from './types';
import { INITIAL_PLAYERS, ANTE_AMOUNT, MAX_POT } from './constants';
import { createDeck, getHandScore, getHandCategory } from './utils/gameLogic';
import PlayerSlot from './components/PlayerSlot';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    players: INITIAL_PLAYERS.map(p => ({
      ...p,
      cards: [],
      isSeen: false,
      status: PlayerStatus.WAITING,
      isDealer: false,
      currentBet: 0
    })),
    pot: 0,
    currentTurn: 0,
    currentStake: ANTE_AMOUNT / 2,
    phase: GamePhase.IDLE,
    logs: ['Welcome to NAWAN!'],
    lastAction: 'Tap DEAL to start',
    winnerIds: null,
  });

  const activePlayers = useMemo(() => state.players.filter(p => p.status === PlayerStatus.ACTIVE), [state.players]);
  const currentPlayer = state.players[state.currentTurn];
  const isUserTurn = state.phase === GamePhase.BETTING && currentPlayer?.id === '1';

  const betAmounts = useMemo(() => {
    if (!currentPlayer) return { x1: 0, x2: 0 };
    const base = state.currentStake;
    const multiplier = currentPlayer.isSeen ? 2 : 1;
    return {
      x1: base * multiplier,
      x2: base * multiplier * 2
    };
  }, [currentPlayer, state.currentStake]);

  const processWinners = useCallback((players: Player[], currentPot: number) => {
    const finalists = players.filter(p => p.status === PlayerStatus.ACTIVE);
    if (finalists.length === 0) return { players, winners: [], action: 'No active players' };

    const scores = finalists.map(p => ({ 
      id: p.id, 
      score: getHandScore(p.cards), 
      category: getHandCategory(p.cards) 
    }));
    
    const minScore = Math.min(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === minScore).map(s => s.id);
    
    const winningAmount = Math.floor(currentPot / winners.length);
    const winnerNames = players.filter(p => winners.includes(p.id)).map(p => p.name).join(' & ');
    const rawCategory = scores.find(s => winners.includes(s.id))?.category ?? "";
    
    // Don't show "Pts" in logs
    const winnerCategory = rawCategory.includes('Pts') ? '' : ` with ${rawCategory}`;

    const updatedPlayers = players.map(p => 
      winners.includes(p.id) ? { ...p, balance: p.balance + winningAmount, currentBet: 0 } : { ...p, currentBet: 0 }
    );

    return {
      players: updatedPlayers,
      winners,
      action: winners.length > 1 
        ? `Split Rs.${winningAmount}${winnerCategory}` 
        : `${winnerNames} wins Rs.${currentPot}${winnerCategory}!`
    };
  }, []);

  const handleShow = useCallback(() => {
    setState(prev => {
      if (prev.phase === GamePhase.SHOWDOWN) return prev;
      const result = processWinners(prev.players, prev.pot);
      return {
        ...prev,
        phase: GamePhase.SHOWDOWN,
        winnerIds: result.winners,
        players: result.players,
        lastAction: result.action
      };
    });
  }, [processWinners]);

  const nextTurn = useCallback(() => {
    setState(prev => {
      if (prev.phase !== GamePhase.BETTING) return prev;
      let nextIdx = (prev.currentTurn + 1) % prev.players.length;
      let safetyCounter = 0;
      while (prev.players[nextIdx].status !== PlayerStatus.ACTIVE && safetyCounter < prev.players.length) {
        nextIdx = (nextIdx + 1) % prev.players.length;
        safetyCounter++;
      }
      return { ...prev, currentTurn: nextIdx };
    });
  }, []);

  const startNewHand = () => {
    const deck = createDeck();
    const playersWithCards = state.players.map((p, idx) => ({
      ...p,
      cards: [deck[idx * 3], deck[idx * 3 + 1], deck[idx * 3 + 2]],
      isSeen: false,
      status: p.balance >= ANTE_AMOUNT ? PlayerStatus.ACTIVE : PlayerStatus.PACKED,
      currentBet: ANTE_AMOUNT,
      balance: p.balance >= ANTE_AMOUNT ? p.balance - ANTE_AMOUNT : p.balance
    }));

    setState(prev => ({
      ...prev,
      players: playersWithCards,
      pot: playersWithCards.filter(p => p.status === PlayerStatus.ACTIVE).length * ANTE_AMOUNT,
      phase: GamePhase.BETTING,
      currentTurn: 0,
      currentStake: ANTE_AMOUNT,
      winnerIds: null,
      lastAction: 'New Round Started'
    }));
  };

  const handleBet = useCallback((multiplier: number) => {
    setState(prev => {
      const player = prev.players[prev.currentTurn];
      if (!player || player.status !== PlayerStatus.ACTIVE) return prev;

      let betAmount = prev.currentStake * multiplier;
      if (player.isSeen) betAmount *= 2;

      const potentialPot = prev.pot + betAmount;

      if (potentialPot >= MAX_POT) {
        const finalPot = MAX_POT;
        const actualBet = MAX_POT - prev.pot;
        const playersAfterBet = prev.players.map((p, idx) => 
          idx === prev.currentTurn ? { ...p, balance: p.balance - actualBet, currentBet: p.currentBet + actualBet } : p
        );
        const result = processWinners(playersAfterBet, finalPot);
        return { ...prev, players: result.players, pot: finalPot, phase: GamePhase.SHOWDOWN, winnerIds: result.winners, lastAction: `LIMIT REACHED! ${result.action}` };
      }

      if (player.balance < betAmount) {
        const newPlayers = prev.players.map((p, idx) => idx === prev.currentTurn ? { ...p, status: PlayerStatus.PACKED } : p);
        const remaining = newPlayers.filter(p => p.status === PlayerStatus.ACTIVE);
        if (remaining.length <= 1) {
           const result = processWinners(newPlayers, prev.pot);
           return { ...prev, players: result.players, winnerIds: result.winners, phase: GamePhase.SHOWDOWN, lastAction: result.action };
        }
        return { ...prev, players: newPlayers, lastAction: `${player.name} Packed` };
      }

      return {
        ...prev,
        players: prev.players.map((p, idx) => 
          idx === prev.currentTurn 
            ? { ...p, balance: p.balance - betAmount, currentBet: p.currentBet + betAmount } 
            : p
        ),
        pot: prev.pot + betAmount,
        currentStake: multiplier === 2 ? prev.currentStake * 2 : prev.currentStake,
        lastAction: `${player.name} Bet Rs.${betAmount}`
      };
    });
    
    setState(curr => {
        if (curr.phase === GamePhase.BETTING) {
            let nextIdx = (curr.currentTurn + 1) % curr.players.length;
            let safety = 0;
            while (curr.players[nextIdx].status !== PlayerStatus.ACTIVE && safety < 10) {
                nextIdx = (nextIdx + 1) % curr.players.length;
                safety++;
            }
            return { ...curr, currentTurn: nextIdx };
        }
        return curr;
    });
  }, [processWinners]);

  const handlePack = useCallback(() => {
    setState(prev => {
      const newPlayers = prev.players.map((p, idx) => idx === prev.currentTurn ? { ...p, status: PlayerStatus.PACKED } : p);
      const remaining = newPlayers.filter(p => p.status === PlayerStatus.ACTIVE);
      if (remaining.length <= 1) {
        const result = processWinners(newPlayers, prev.pot);
        return { ...prev, phase: GamePhase.SHOWDOWN, winnerIds: result.winners, players: result.players, lastAction: result.action };
      }
      return { ...prev, players: newPlayers, lastAction: 'Packed' };
    });
    nextTurn();
  }, [nextTurn, processWinners]);

  const handleSee = useCallback(() => {
    setState(prev => ({
      ...prev,
      players: prev.players.map((p, idx) => idx === prev.currentTurn ? { ...p, isSeen: true } : p),
      lastAction: 'Viewing Cards'
    }));
  }, []);

  useEffect(() => {
    if (state.phase === GamePhase.BETTING && !isUserTurn && !state.winnerIds) {
      const ai = state.players[state.currentTurn];
      if (!ai || ai.status !== PlayerStatus.ACTIVE) {
        nextTurn();
        return;
      }
      const timer = setTimeout(() => {
        if (!ai.isSeen && Math.random() > 0.8) {
           setState(curr => ({...curr, players: curr.players.map(p => p.id === ai.id ? {...p, isSeen: true} : p)}));
        }
        
        setTimeout(() => {
          const score = getHandScore(ai.cards);
          const nextBet = ai.isSeen ? state.currentStake * 2 : state.currentStake;
          
          if (activePlayers.length === 2 && ai.isSeen && score < 400 && Math.random() > 0.7) {
             handleShow();
             return;
          }

          if (state.pot + nextBet >= MAX_POT) {
             if (activePlayers.length === 2) handleShow();
             else handlePack();
             return;
          }

          const actionRoll = Math.random();
          const isSeen = ai.isSeen;
          
          if (isSeen) {
             if (score < 400) {
                actionRoll > 0.4 ? handleBet(2) : handleBet(1);
             } else if (score < 800) {
                actionRoll > 0.8 ? handleBet(2) : (actionRoll < 0.1 ? handlePack() : handleBet(1));
             } else {
                actionRoll > 0.6 ? handlePack() : handleBet(1);
             }
          } else {
             actionRoll > 0.9 ? handleBet(2) : (actionRoll < 0.05 ? handlePack() : handleBet(1));
          }
        }, 500);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.currentTurn, state.phase, isUserTurn, state.winnerIds, handleBet, handlePack, nextTurn, state.pot, handleShow, activePlayers.length, state.currentStake]);

  const isPotFull = state.pot >= MAX_POT;
  const userSpent = state.players[0].currentBet;

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-[#010410] overflow-hidden select-none">
      <header className="shrink-0 flex justify-between items-center px-3 py-1 bg-slate-950 border-b border-amber-400/20 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-cinzel text-black font-black text-base">N</div>
          <div>
            <h1 className="text-base font-cinzel text-amber-400 font-bold tracking-widest leading-none uppercase">Nawan</h1>
            <p className="text-[6px] text-amber-200/40 uppercase font-black tracking-widest">Banti Solutions</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1.5 leading-none mb-0.5">
             <span className={`text-[7px] font-black uppercase ${isPotFull ? 'text-red-500 animate-pulse' : 'text-amber-400/50'}`}>
               {isPotFull ? 'LIMIT REACHED' : 'TOTAL POT'}
             </span>
             <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">LIMIT: Rs.{MAX_POT.toLocaleString()}</span>
           </div>
           <span className={`text-base md:text-xl font-mono font-black leading-none ${isPotFull ? 'text-red-400' : 'text-white'}`}>
             Rs.{state.pot.toLocaleString()}
           </span>
        </div>
      </header>

      <main className="flex-grow relative z-10 overflow-hidden flex items-start justify-center pt-8 md:pt-12">
        <div className="table-light opacity-20"></div>

        <div className="table-3d w-full h-[85%] md:h-[90%] relative max-w-6xl mx-auto flex items-center justify-center transform translate-y-4 md:translate-y-6">
          <div className="absolute inset-4 md:inset-[10%] bg-[#064e3b] rounded-[100px] md:rounded-[200px] border-[10px] md:border-[16px] border-[#3f311c] shadow-[0_0_100px_rgba(0,0,0,0.8)_inset,0_20px_60px_rgba(0,0,0,0.9)] flex items-center justify-center">
             <div className="opacity-[0.03] text-[8rem] md:text-[20rem] font-cinzel text-white font-black rotate-[-15deg] select-none pointer-events-none">NAWAN</div>
          </div>

          <div className="absolute top-[8%] left-[38%] -translate-x-1/2 -translate-y-1/2 scale-[0.75] md:scale-95">
            <PlayerSlot player={state.players[3]} isCurrentTurn={state.currentTurn === 3} isWinner={state.winnerIds?.includes(state.players[3].id) ?? false} showCards={state.phase === GamePhase.SHOWDOWN} />
          </div>
          <div className="absolute top-[8%] right-[38%] translate-x-1/2 -translate-y-1/2 scale-[0.75] md:scale-95">
            <PlayerSlot player={state.players[2]} isCurrentTurn={state.currentTurn === 2} isWinner={state.winnerIds?.includes(state.players[2].id) ?? false} showCards={state.phase === GamePhase.SHOWDOWN} />
          </div>

          <div className="absolute top-[50%] left-[7%] md:left-[10%] -translate-y-1/2 scale-[0.75] md:scale-95">
            <PlayerSlot player={state.players[4]} isCurrentTurn={state.currentTurn === 4} isWinner={state.winnerIds?.includes(state.players[4].id) ?? false} showCards={state.phase === GamePhase.SHOWDOWN} />
          </div>
          <div className="absolute top-[50%] right-[7%] md:right-[10%] -translate-y-1/2 scale-[0.75] md:scale-95">
            <PlayerSlot player={state.players[1]} isCurrentTurn={state.currentTurn === 1} isWinner={state.winnerIds?.includes(state.players[1].id) ?? false} showCards={state.phase === GamePhase.SHOWDOWN} />
          </div>

          <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 z-20 scale-90 md:scale-110">
            <PlayerSlot player={state.players[0]} isCurrentTurn={state.currentTurn === 0} isWinner={state.winnerIds?.includes(state.players[0].id) ?? false} showCards={state.phase === GamePhase.SHOWDOWN} />
          </div>
        </div>
      </main>

      <footer className="shrink-0 w-full bg-slate-950 border-t border-amber-400/20 p-1.5 pb-safe z-50">
        {state.phase === GamePhase.IDLE || state.phase === GamePhase.SHOWDOWN ? (
          <button onClick={startNewHand} className="w-full py-3 bg-amber-500 text-black font-black text-lg uppercase rounded-lg tracking-[0.3em] hover:bg-amber-400">
            {state.phase === GamePhase.SHOWDOWN ? 'NEW ROUND' : 'DEAL'}
          </button>
        ) : (
          <div className="max-w-4xl mx-auto flex flex-col gap-1">
            <div className="flex justify-between items-center px-4 py-0.5 border-b border-white/5 mb-0.5">
               <span className={`text-[8px] font-black uppercase tracking-widest truncate max-w-[60%] ${isPotFull ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                 {state.lastAction}
               </span>
               <div className="flex items-center">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">STACK: Rs.{userSpent.toLocaleString()}</span>
               </div>
            </div>

            <div className="grid grid-cols-5 gap-1">
              <button onClick={handleSee} disabled={!isUserTurn || currentPlayer?.isSeen} className={`flex flex-col items-center justify-center py-1.5 rounded-md border-2 transition-all ${isUserTurn && !currentPlayer?.isSeen ? 'bg-blue-600 border-blue-400 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                <span className="text-[8px] font-black">SEE</span>
                <span className="text-[6px] opacity-70 uppercase">Cards</span>
              </button>
              
              <button onClick={() => handleBet(1)} disabled={!isUserTurn || isPotFull} className={`flex flex-col items-center justify-center py-1.5 rounded-md border-2 transition-all ${isUserTurn && !isPotFull ? 'bg-amber-500 border-amber-300 text-black' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                <span className="text-[8px] font-black uppercase">{currentPlayer?.isSeen ? 'CHAAL' : 'BLIND'}</span>
                <span className="text-[7px] font-bold">Rs.{betAmounts.x1}</span>
              </button>
              
              <button onClick={() => handleBet(2)} disabled={!isUserTurn || isPotFull} className={`flex flex-col items-center justify-center py-1.5 rounded-md border-2 transition-all ${isUserTurn && !isPotFull ? 'bg-amber-600 border-amber-400 text-black' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                <span className="text-[8px] font-black uppercase">{currentPlayer?.isSeen ? 'CHAAL 2x' : 'BLIND 2x'}</span>
                <span className="text-[7px] font-bold">Rs.{betAmounts.x2}</span>
              </button>
              
              <button onClick={handleShow} disabled={!isUserTurn || activePlayers.length !== 2} className={`flex flex-col items-center justify-center py-1.5 rounded-md border-2 transition-all ${isUserTurn && activePlayers.length === 2 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                <span className="text-[8px] font-black uppercase">SHOW</span>
                <span className="text-[6px] opacity-70 uppercase">Reveal</span>
              </button>
              
              <button onClick={handlePack} disabled={!isUserTurn} className={`flex flex-col items-center justify-center py-1.5 rounded-md border-2 transition-all ${isUserTurn ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                <span className="text-[8px] font-black uppercase">PACK</span>
                <span className="text-[6px] opacity-70 uppercase">Fold</span>
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default App;
