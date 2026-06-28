const express = require('express');
const http    = require('http');
const path    = require('path');
const { Server } = require('socket.io');
const LobbyManager = require('./LobbyManager');
const Matchmaking  = require('./Matchmaking');

const PORT   = process.env.PORT || 3001;
const CLIENT = path.join(__dirname, 'public'); // React build served from here

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Static frontend ──────────────────────────────────────────────────────────
app.use(express.static(CLIENT));
app.get('*', (_, res) => res.sendFile(path.join(CLIENT, 'index.html')));

// ── Game managers ────────────────────────────────────────────────────────────
const lobbyManager = new LobbyManager(io);
const matchmaking  = new Matchmaking(io, lobbyManager);

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', socket => {

  function findRoom() { return lobbyManager.findRoomBySocket(socket.id); }

  // ── Lobby: create private ─────────────────────────────────────────────────
  socket.on('create_lobby', ({ nickname, sessionToken, config = {} }) => {
    const name = sanitizeName(nickname);
    const room = lobbyManager.createPrivate(socket.id, name, sessionToken, config);
    socket.join(room.code);
    socket.emit('lobby_joined', {
      code:     room.code,
      isHost:   true,
      myId:     socket.id,
      players:  room._publicPlayers(),
      config:   room.config,
      chat:     room.chat,
    });
  });

  // ── Lobby: join private ───────────────────────────────────────────────────
  socket.on('join_lobby', ({ nickname, sessionToken, code }) => {
    const name   = sanitizeName(nickname);
    const result = lobbyManager.joinPrivate(socket.id, name, sessionToken, code);
    if (result.error) { socket.emit('error', { message: result.error }); return; }
    const { room } = result;
    socket.join(room.code);
    socket.emit('lobby_joined', {
      code:     room.code,
      isHost:   false,
      myId:     socket.id,
      players:  room._publicPlayers(),
      config:   room.config,
      chat:     room.chat,
    });
    io.to(room.code).emit('lobby_updated', { players: room._publicPlayers(), config: room.config });
  });

  // ── Lobby: host starts game ───────────────────────────────────────────────
  socket.on('start_game', () => {
    const room = findRoom();
    if (!room || room.hostId !== socket.id) return;
    if (room.phase !== 'waiting') return;
    const active = room.players.filter(p => p.connected).length;
    if (active < 2) { socket.emit('error', { message: 'Mindestens 2 Spieler benötigt' }); return; }
    room.startGame();
  });

  // ── Lobby: update config (host only) ─────────────────────────────────────
  socket.on('update_config', (config) => {
    const room = findRoom();
    if (!room) return;
    room.updateConfig(socket.id, config);
  });

  // ── Matchmaking: join public ──────────────────────────────────────────────
  socket.on('join_matchmaking', ({ nickname, sessionToken }) => {
    const name = sanitizeName(nickname);
    matchmaking.join(socket.id, name, sessionToken);
  });

  socket.on('leave_matchmaking', () => {
    matchmaking.leave(socket.id);
  });

  // ── In-game: push ─────────────────────────────────────────────────────────
  socket.on('game_push', ({ side, index, rotation }) => {
    const room = findRoom();
    if (!room) return;
    const result = room.handlePush(socket.id, side, index, rotation ?? null);
    if (result?.error) socket.emit('error', { message: result.error });
  });

  // ── In-game: move ─────────────────────────────────────────────────────────
  socket.on('game_move', ({ row, col }) => {
    const room = findRoom();
    if (!room) return;
    const result = room.handleMove(socket.id, row, col);
    if (result?.error) socket.emit('error', { message: result.error });
  });

  // ── In-game: rotate extra tile ────────────────────────────────────────────
  socket.on('game_rotate', ({ rotation }) => {
    const room = findRoom();
    if (!room) return;
    room.handleRotateExtra(socket.id, rotation);
  });

  // ── In-game: skip (stay in place) ────────────────────────────────────────
  socket.on('game_skip', () => {
    const room = findRoom();
    if (!room) return;
    const cp = room.players[room.currentIdx];
    if (!cp || cp.id !== socket.id) return;
    if (room.phase === 'move') room.handleMove(socket.id, cp.position.row, cp.position.col);
  });

  // ── Chat ──────────────────────────────────────────────────────────────────
  socket.on('send_chat', ({ message }) => {
    const room = findRoom();
    if (room && typeof message === 'string') room.handleChat(socket.id, message);
  });

  // ── Votekick ──────────────────────────────────────────────────────────────
  socket.on('vote_kick', ({ targetId }) => {
    const room = findRoom();
    if (room) room.handleVoteKick(socket.id, targetId);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    matchmaking.leave(socket.id);
    const room = findRoom();
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        room._systemChat(`⚠️ ${player.name} hat die Verbindung verloren.`);
        room.removePlayer(socket.id);
        io.to(room._roomId()).emit('lobby_updated', { players: room._publicPlayers(), config: room.config });
      }
    }
  });
});

function sanitizeName(raw) {
  return String(raw ?? 'Spieler').replace(/[<>]/g, '').trim().slice(0, 20) || 'Spieler';
}

server.listen(PORT, () => console.log(`🎲 Labyrinth-Server läuft auf Port ${PORT}`));
