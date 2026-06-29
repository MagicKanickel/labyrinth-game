import { useState, useRef, useCallback } from 'react';
import { createGame, makeCard } from './game';
import MenuScreen  from './components/MenuScreen';
import SetupScreen from './components/SetupScreen';
import GameScreen  from './components/GameScreen';
import WinScreen   from './components/WinScreen';

// Timing constants (ms)
const FLIP_MS      = 520;   // flip animation duration
const RESULT_MS    = 1100;  // how long to show reveal result
const FLIPBACK_MS  = 480;   // flip-back animation
const MOVE_MS      = 650;   // stone slide duration
const CELEBRATE_MS = 2600;  // card-win celebration
const CARDS_TO_WIN = 3;

function useGame() {
  const [state, setState] = useState(null);
  const stateRef = useRef(null);

  function set(updater) {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      stateRef.current = next;
      return next;
    });
  }

  const start = useCallback((names) => {
    const gs = createGame(names);
    stateRef.current = gs;
    setState(gs);
  }, []);

  const flip = useCallback((stoneId) => {
    const gs = stateRef.current;
    if (!gs || gs.phase !== 'choosing') return;
    const stone = gs.stones.find(s => s.id === stoneId);
    if (!stone) return;

    // 1 – Flip stone face-up
    set(s => ({
      ...s,
      phase:  'busy',
      stones: s.stones.map(st => st.id === stoneId ? { ...st, flipped: true } : st),
    }));

    // 2 – After flip animation: check result
    setTimeout(() => {
      const curr = stateRef.current;
      if (!curr) return;
      const st       = curr.stones.find(s => s.id === stoneId);
      const required = curr.card.colors[curr.card.foundCount];
      const correct  = st.color === required;

      set(s => ({
        ...s,
        lastReveal: { stoneId, correct, color: st.color, colorName: st.colorName, colorGlow: st.colorGlow },
      }));

      if (correct) {
        const newFound  = curr.card.foundCount + 1;
        const cardDone  = newFound >= 4;
        set(s => ({
          ...s,
          card:        { ...s.card, foundCount: newFound },
          roundWinner: cardDone ? s.currentPlayerIndex : s.roundWinner,
          phase:       cardDone ? 'celebrating' : 'busy',
        }));

        // 3a – Flip stone back after showing result
        setTimeout(() => {
          set(s => ({
            ...s,
            stones: s.stones.map(st2 => st2.id === stoneId ? { ...st2, flipped: false } : st2),
          }));
          setTimeout(() => {
            if (cardDone) resolveCardWon();
            else          advanceTurn();
          }, FLIPBACK_MS);
        }, RESULT_MS);

      } else {
        // 3b – Wrong: flip back, then slide to empty slot
        setTimeout(() => {
          set(s => ({
            ...s,
            stones: s.stones.map(st2 => st2.id === stoneId ? { ...st2, flipped: false } : st2),
          }));
          setTimeout(() => {
            const curr2   = stateRef.current;
            if (!curr2) return;
            const fromPos = curr2.stones.find(s => s.id === stoneId).position;
            const toPos   = curr2.emptyPosition;
            set(s => ({
              ...s,
              stones:       s.stones.map(st2 => st2.id === stoneId ? { ...st2, position: toPos } : st2),
              emptyPosition: fromPos,
            }));
            setTimeout(advanceTurn, MOVE_MS);
          }, FLIPBACK_MS);
        }, RESULT_MS);
      }
    }, FLIP_MS);
  }, []);

  function advanceTurn() {
    set(s => ({
      ...s,
      phase:               'choosing',
      currentPlayerIndex:  (s.currentPlayerIndex + 1) % s.players.length,
      lastReveal:          null,
    }));
  }

  function resolveCardWon() {
    setTimeout(() => {
      set(s => {
        const winner     = s.roundWinner;
        const newPlayers = s.players.map((p, i) =>
          i === winner ? { ...p, score: p.score + 1 } : p
        );
        if (newPlayers[winner].score >= CARDS_TO_WIN) {
          return {
            ...s,
            players:    newPlayers,
            phase:      'gameOver',
            gameWinner: winner,
            winnerName: newPlayers[winner].name,
          };
        }
        return {
          ...s,
          players:            newPlayers,
          card:               makeCard(),
          currentPlayerIndex: (winner + 1) % s.players.length,
          roundWinner:        null,
          lastReveal:         null,
          phase:              'choosing',
          stones:             s.stones.map(st => ({ ...st, flipped: false })),
        };
      });
    }, CELEBRATE_MS);
  }

  return { state, start, flip };
}

export default function App() {
  const [screen, setScreen] = useState('menu');
  const game = useGame();

  function handleStart(names) {
    game.start(names);
    setScreen('game');
  }

  if (screen === 'menu') {
    return <MenuScreen onPlay={() => setScreen('setup')} />;
  }
  if (screen === 'setup') {
    return <SetupScreen onStart={handleStart} onBack={() => setScreen('menu')} />;
  }
  if (screen === 'game' && game.state) {
    if (game.state.phase === 'gameOver') {
      return (
        <WinScreen
          winnerName={game.state.winnerName}
          players={game.state.players}
          onRestart={() => setScreen('setup')}
          onMenu={() => setScreen('menu')}
        />
      );
    }
    return <GameScreen state={game.state} onFlip={game.flip} />;
  }
  return <MenuScreen onPlay={() => setScreen('setup')} />;
}
