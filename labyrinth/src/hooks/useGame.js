import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createInitialBoard } from '../logic/board';
import { getReachableTiles } from '../logic/pathfinding';
import { applyPush, isReversePush } from '../logic/push';
import { getConnections } from '../logic/tiles';
import {
  computeBotPush, computeBotMove,
  computeHintPush, computeHintMove,
  updateLearningSkill,
} from '../logic/bot';
import { playPush, playMove, playCardFound, playWin, playBotMove } from '../logic/sound';

const PLAYER_COLORS = ['#e74c3c', '#3498db'];
const START_POSITIONS = [{ row: 0, col: 0 }, { row: 6, col: 6 }];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function collectBoardPersons(board) {
  const ids = [];
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++)
      if (board[r][c].person) ids.push(board[r][c].person);
  return ids;
}

function newTilePosition(side, index) {
  if (side === 'top')    return { row: 0,     col: index };
  if (side === 'bottom') return { row: 6,     col: index };
  if (side === 'left')   return { row: index, col: 0     };
  return                        { row: index, col: 6     }; // right
}

function buildInitialState() {
  return {
    phase: 'config',
    board: null,
    extraTile: null,
    players: [],
    currentPlayerIndex: 0,
    lastPush: null,
    winner: null,
    config: { cardsPerPlayer: 4, personsCount: 12, botDifficulty: 'medium' },
    reachableTiles: [],
    // animation helpers
    animatingPlayer: null,   // player id that should animate its move
    newTilePos: null,        // { row, col, count } for slide-in animation
  };
}

export function useGame() {
  const [state, setState] = useState(buildInitialState);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // ── Win sound ────────────────────────────────────────────────────────────────
  const prevWinnerRef = useRef(null);
  useEffect(() => {
    if (state.winner !== null && prevWinnerRef.current === null) playWin();
    prevWinnerRef.current = state.winner;
  }, [state.winner]);

  // ── Start game ──────────────────────────────────────────────────────────────
  const startGame = useCallback((config) => {
    const { board, extraTile } = createInitialBoard(config.personsCount);
    const allPersonIds = shuffle(collectBoardPersons(board));
    const cpp = Math.min(config.cardsPerPlayer, Math.floor(allPersonIds.length / 2));

    const names  = config.twoPlayer ? ['Spieler 1', 'Spieler 2'] : ['Du', 'Bot'];
    const isBots = config.twoPlayer ? [false, false]             : [false, true];

    const players = [0, 1].map(i => ({
      id: i,
      name: names[i],
      color: PLAYER_COLORS[i],
      position: { ...START_POSITIONS[i] },
      startPosition: { ...START_POSITIONS[i] },
      cards: allPersonIds.slice(i * cpp, (i + 1) * cpp),
      currentCardIndex: 0,
      isBot: isBots[i],
      foundAll: false,
    }));

    setState({
      phase: 'push',
      board,
      extraTile,
      players,
      currentPlayerIndex: 0,
      lastPush: null,
      winner: null,
      config,
      reachableTiles: [],
      animatingPlayer: null,
      newTilePos: null,
    });
  }, []);

  // ── Rotate extra tile (human only) ─────────────────────────────────────────
  const rotateExtra = useCallback(() => {
    setState(s => {
      if (s.phase !== 'push' || s.players[s.currentPlayerIndex]?.isBot) return s;
      const r = s.extraTile.rotation;
      const newRot = (r + 90) % 360;
      return { ...s, extraTile: { ...s.extraTile, rotation: newRot, connections: getConnections(s.extraTile.type, newRot) } };
    });
  }, []);

  // ── Push tile ───────────────────────────────────────────────────────────────
  const pushTile = useCallback((side, index, rotationOverride) => {
    const s = stateRef.current;
    if (s.phase !== 'push') return;
    if (isReversePush(s.lastPush, side, index)) return;

    // Sound: human = playPush, bot = playBotMove
    if (s.players[s.currentPlayerIndex]?.isBot) playBotMove();
    else playPush();

    setState(prev => {
      if (prev.phase !== 'push') return prev;
      if (isReversePush(prev.lastPush, side, index)) return prev;

      const tileToInsert = rotationOverride != null
        ? { ...prev.extraTile, rotation: rotationOverride, connections: getConnections(prev.extraTile.type, rotationOverride) }
        : prev.extraTile;

      const { newBoard, pushedOut, newPlayers } = applyPush(prev.board, tileToInsert, side, index, prev.players);
      const cp = newPlayers[prev.currentPlayerIndex];
      const reachable = getReachableTiles(newBoard, cp.position.row, cp.position.col);
      const ntp = newTilePosition(side, index);

      return {
        ...prev,
        board: newBoard,
        extraTile: pushedOut,
        players: newPlayers,
        lastPush: { side, index },
        phase: 'move',
        reachableTiles: reachable,
        animatingPlayer: null,
        newTilePos: { ...ntp, count: (prev.newTilePos?.count ?? 0) + 1 },
      };
    });
  }, []);

  // ── Move player ─────────────────────────────────────────────────────────────
  const movePlayer = useCallback((row, col) => {
    const s = stateRef.current;
    if (s.phase !== 'move') return;
    if (!s.reachableTiles.some(([r, c]) => r === row && c === col)) return;

    // Determine if card will be found
    const cp = s.players[s.currentPlayerIndex];
    const targetCard = cp.cards[cp.currentCardIndex];
    const tileHere = s.board[row][col];
    const willFind = targetCard != null && tileHere.person === targetCard;
    if (willFind) playCardFound(); else playMove();

    setState(prev => {
      if (prev.phase !== 'move') return prev;
      if (!prev.reachableTiles.some(([r, c]) => r === row && c === col)) return prev;

      const players = prev.players.map(p => ({ ...p }));
      const player = players[prev.currentPlayerIndex];
      player.position = { row, col };

      const card = player.cards[player.currentCardIndex];
      if (card != null && prev.board[row][col].person === card) {
        player.currentCardIndex += 1;
      }

      const allFound = player.currentCardIndex >= player.cards.length;
      if (allFound) player.foundAll = true;

      const atStart = row === player.startPosition.row && col === player.startPosition.col;
      if (player.foundAll && atStart) {
        updateLearningSkill(player.isBot);
        return { ...prev, players, phase: 'end', winner: player.id, reachableTiles: [], animatingPlayer: player.id };
      }

      const next = (prev.currentPlayerIndex + 1) % 2;
      return { ...prev, players, currentPlayerIndex: next, phase: 'push', reachableTiles: [], animatingPlayer: player.id };
    });
  }, []);

  // ── Skip move ───────────────────────────────────────────────────────────────
  const skipMove = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'move') return;
    const cp = s.players[s.currentPlayerIndex];
    movePlayer(cp.position.row, cp.position.col);
  }, [movePlayer]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => setState(buildInitialState), []);

  // ── Bot automation ──────────────────────────────────────────────────────────
  useEffect(() => {
    const s = state;
    if (!s.board || s.phase === 'end' || s.phase === 'config') return;
    const cp = s.players[s.currentPlayerIndex];
    if (!cp?.isBot) return;

    if (s.phase === 'push') {
      const t = setTimeout(() => {
        const cur = stateRef.current;
        if (cur.phase !== 'push' || !cur.players[cur.currentPlayerIndex]?.isBot) return;
        const action = computeBotPush(cur);
        pushTile(action.side, action.index, action.rotation);
      }, 900);
      return () => clearTimeout(t);
    }

    if (s.phase === 'move') {
      const t = setTimeout(() => {
        const cur = stateRef.current;
        if (cur.phase !== 'move' || !cur.players[cur.currentPlayerIndex]?.isBot) return;
        const target = computeBotMove(cur);
        movePlayer(target.row, target.col);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.phase, state.currentPlayerIndex, pushTile, movePlayer]);

  // ── Learning hint ────────────────────────────────────────────────────────────
  const hint = useMemo(() => {
    if (!state.board) return null;
    if (state.config.botDifficulty !== 'learning') return null;
    const cp = state.players[state.currentPlayerIndex];
    if (!cp || cp.isBot) return null;

    if (state.phase === 'push') {
      return { type: 'push', ...computeHintPush(state) };
    }
    if (state.phase === 'move') {
      return { type: 'move', ...computeHintMove(state) };
    }
    return null;
  }, [state]);

  return { state, startGame, rotateExtra, pushTile, movePlayer, skipMove, resetGame, hint };
}
