import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, connectSocket, getSessionToken } from '../services/socket';

export function useOnlineGame() {
  const [screen, setScreen] = useState('menu');  // menu | lobby | waiting | game | end
  const [nickname, setNickname] = useState(() => localStorage.getItem('labyrinth_nickname') ?? '');
  const [lobbyCode, setLobbyCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [myId, setMyId]     = useState(null);
  const [players, setPlayers] = useState([]);
  const [config, setConfig]   = useState({});
  const [gameState, setGameState] = useState(null);
  const [chat, setChat]     = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [matchmakingInfo, setMatchmakingInfo] = useState(null);
  const [error, setError]   = useState(null);

  const socketRef    = useRef(null);
  const myIdRef      = useRef(null);
  const nicknameRef  = useRef(nickname);

  useEffect(() => { myIdRef.current = myId; }, [myId]);
  useEffect(() => { nicknameRef.current = nickname; }, [nickname]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('lobby_joined', data => {
      setLobbyCode(data.code);
      setIsHost(data.isHost);
      setMyId(data.myId);
      setPlayers(data.players);
      setConfig(data.config);
      setChat(data.chat ?? []);
      setError(null);
      setScreen(data.isHost ? 'waiting' : 'waiting');
    });

    socket.on('lobby_updated', data => {
      setPlayers(data.players);
      setConfig(data.config);
    });

    socket.on('game_started', data => {
      setGameState(data);
      setScreen('game');
    });

    socket.on('game_state', state => {
      setGameState(state);
      if (state.phase === 'end') setScreen('end');
      setTimeLeft(state.timeLeft);
    });

    socket.on('timer_tick', ({ timeLeft }) => setTimeLeft(timeLeft));

    socket.on('chat_message', msg => {
      setChat(prev => [...prev.slice(-99), msg]);
    });

    socket.on('matchmaking_update', info => setMatchmakingInfo(info));

    socket.on('player_kicked', ({ players: newPlayers }) => {
      setPlayers(newPlayers);
    });

    socket.on('you_were_kicked', () => {
      setError('Du wurdest aus der Lobby entfernt.');
      setScreen('menu');
    });

    socket.on('error', ({ message }) => setError(message));

    socket.on('disconnect', () => {
      if (screen !== 'menu') setError('Verbindung zum Server verloren.');
    });

    return () => {
      socket.off('lobby_joined');
      socket.off('lobby_updated');
      socket.off('game_started');
      socket.off('game_state');
      socket.off('timer_tick');
      socket.off('chat_message');
      socket.off('matchmaking_update');
      socket.off('player_kicked');
      socket.off('you_were_kicked');
      socket.off('error');
      socket.off('disconnect');
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const saveNickname = useCallback((name) => {
    setNickname(name);
    nicknameRef.current = name;
    localStorage.setItem('labyrinth_nickname', name);
  }, []);

  const createLobby = useCallback((cfg) => {
    socketRef.current.emit('create_lobby', { nickname: nicknameRef.current, sessionToken: getSessionToken(), config: cfg });
  }, []);

  const joinLobby = useCallback((code) => {
    socketRef.current.emit('join_lobby', { nickname: nicknameRef.current, sessionToken: getSessionToken(), code });
  }, []);

  const joinMatchmaking = useCallback(() => {
    socketRef.current.emit('join_matchmaking', { nickname: nicknameRef.current, sessionToken: getSessionToken() });
    setScreen('matchmaking');
  }, []);

  const leaveMatchmaking = useCallback(() => {
    socketRef.current.emit('leave_matchmaking');
    setScreen('menu');
    setMatchmakingInfo(null);
  }, []);

  const startGame = useCallback(() => {
    socketRef.current.emit('start_game');
  }, []);

  const updateConfig = useCallback((cfg) => {
    socketRef.current.emit('update_config', cfg);
  }, []);

  const pushTile = useCallback((side, index, rotation) => {
    socketRef.current.emit('game_push', { side, index, rotation });
  }, []);

  const movePiece = useCallback((row, col) => {
    socketRef.current.emit('game_move', { row, col });
  }, []);

  const skipMove = useCallback(() => {
    socketRef.current.emit('game_skip');
  }, []);

  const rotateExtra = useCallback((rotation) => {
    socketRef.current.emit('game_rotate', { rotation });
  }, []);

  const sendChat = useCallback((message) => {
    if (!message.trim()) return;
    socketRef.current.emit('send_chat', { message });
  }, []);

  const voteKick = useCallback((targetId) => {
    socketRef.current.emit('vote_kick', { targetId });
  }, []);

  const returnToMenu = useCallback(() => {
    socketRef.current.emit('leave_matchmaking');
    setScreen('menu');
    setGameState(null);
    setChat([]);
    setError(null);
    setMatchmakingInfo(null);
  }, []);

  // Derived
  const myPlayerIndex = gameState
    ? gameState.players.findIndex(p => p.id === myIdRef.current)
    : players.findIndex(p => p.id === myId);

  const isMyTurn = gameState && gameState.players[gameState.currentPlayerIndex]?.id === myId;

  return {
    // State
    screen, nickname, lobbyCode, isHost, myId, myPlayerIndex,
    players, config, gameState, chat, timeLeft, matchmakingInfo, error, isMyTurn,
    // Actions
    saveNickname, createLobby, joinLobby, joinMatchmaking, leaveMatchmaking,
    startGame, updateConfig, pushTile, movePiece, skipMove, rotateExtra,
    sendChat, voteKick, returnToMenu, setError,
  };
}
