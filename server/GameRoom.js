const { createInitialBoard } = require('./shared/board');
const { applyPush, isReversePush, getAllPushPositions } = require('./shared/push');
const { getConnections } = require('./shared/tiles');
const { getReachableTiles } = require('./shared/pathfinding');

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'];
const START_POSITIONS = [
  { row: 0, col: 0 }, // red   – top-left
  { row: 0, col: 6 }, // blue  – top-right
  { row: 6, col: 0 }, // green – bottom-left
  { row: 6, col: 6 }, // yellow– bottom-right
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class GameRoom {
  constructor({ code, isPrivate, hostId, config, io }) {
    this.code      = code;          // 6-char string (private) | null (public)
    this.isPrivate = isPrivate;
    this.hostId    = hostId;        // socket.id of host (private only)
    this.config    = {              // tunable by host
      maxPlayers:    config.maxPlayers    ?? 4,
      cardsPerPlayer:config.cardsPerPlayer?? 4,
      turnTime:      config.turnTime      ?? (isPrivate ? 60 : 30),
      personsCount:  config.personsCount  ?? 12,
    };
    this.io = io;

    this.players      = [];   // see addPlayer()
    this.phase        = 'waiting';
    this.board        = null;
    this.extraTile    = null;
    this.currentIdx   = 0;
    this.lastPush     = null;
    this.winner       = null;
    this.reachable    = [];
    this.newTilePos   = null;
    this.pushCount    = 0;

    this.timerInterval  = null;
    this.timeLeft       = 0;

    this.chat         = [];   // { from, message, timestamp, system }
    this.votekick     = {};   // { targetId: Set<voterId> }
    this.bannedSessions = new Set();
  }

  // ── Players ──────────────────────────────────────────────────────────────────

  addPlayer(socketId, name, sessionToken) {
    const idx = this.players.length;
    this.players.push({
      id:            socketId,
      name,
      sessionToken,
      color:         PLAYER_COLORS[idx],
      position:      { ...START_POSITIONS[idx] },
      startPosition: { ...START_POSITIONS[idx] },
      cards:         [],
      currentCardIndex: 0,
      foundAll:      false,
      timeouts:      0,
      connected:     true,
    });
  }

  removePlayer(socketId) {
    const p = this.players.find(p => p.id === socketId);
    if (p) p.connected = false;

    // Reassign host if needed
    if (this.isPrivate && socketId === this.hostId) {
      const next = this.players.find(p => p.connected);
      this.hostId = next?.id ?? null;
    }

    // If it's this player's turn, skip it
    if (this.phase !== 'waiting' && this.phase !== 'end') {
      const cp = this.players[this.currentIdx];
      if (cp && cp.id === socketId) this._skipCurrentTurn();
    }

    // Game can't continue with < 2 connected players
    const connected = this.players.filter(p => p.connected).length;
    if (this.phase !== 'waiting' && this.phase !== 'end' && connected < 2) {
      this._endByAbandonment();
    }
  }

  isBanned(sessionToken) {
    return this.bannedSessions.has(sessionToken);
  }

  isFull() {
    return this.players.filter(p => p.connected).length >= this.config.maxPlayers;
  }

  // ── Game start ───────────────────────────────────────────────────────────────

  startGame() {
    const { board, extraTile } = createInitialBoard(this.config.personsCount);
    this.board     = board;
    this.extraTile = extraTile;

    // Collect all person IDs from the board
    const personIds = [];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        if (board[r][c].person) personIds.push(board[r][c].person);

    const shuffledIds = shuffle(personIds);
    const activePlayers = this.players.filter(p => p.connected);
    const cpp = Math.min(this.config.cardsPerPlayer, Math.floor(shuffledIds.length / activePlayers.length));

    activePlayers.forEach((player, i) => {
      player.cards = shuffledIds.slice(i * cpp, (i + 1) * cpp);
      player.currentCardIndex = 0;
      player.foundAll = false;
      player.timeouts = 0;
    });

    this.currentIdx = 0;
    this.lastPush   = null;
    this.winner     = null;
    this.phase      = 'push';
    this.reachable  = [];
    this.votekick   = {};

    this._startTimer();
    this._broadcast('game_started', this._stateSnapshot());
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  handlePush(socketId, side, index, rotation) {
    if (this.phase !== 'push') return { error: 'Nicht in der Schieberunde' };
    const cp = this.players[this.currentIdx];
    if (!cp || cp.id !== socketId) return { error: 'Nicht dein Zug' };
    if (isReversePush(this.lastPush, side, index)) return { error: 'Rückgängig-Zug verboten' };

    let tileToInsert = { ...this.extraTile };
    if (rotation != null) {
      tileToInsert = { ...tileToInsert, rotation, connections: getConnections(tileToInsert.type, rotation) };
    }

    const { newBoard, pushedOut, newPlayers } = applyPush(this.board, tileToInsert, side, index, this.players);
    this.board     = newBoard;
    this.extraTile = pushedOut;
    this.players   = newPlayers;
    this.lastPush  = { side, index };
    this.pushCount++;

    // Compute new tile position (where the inserted tile landed)
    if (side === 'left')   this.newTilePos = { row: index, col: 0,     count: this.pushCount };
    if (side === 'right')  this.newTilePos = { row: index, col: 6,     count: this.pushCount };
    if (side === 'top')    this.newTilePos = { row: 0,     col: index,  count: this.pushCount };
    if (side === 'bottom') this.newTilePos = { row: 6,     col: index,  count: this.pushCount };

    const player = this.players[this.currentIdx];
    this.reachable = getReachableTiles(this.board, player.position.row, player.position.col);
    this.phase = 'move';

    cp.timeouts = 0; // reset timeout counter on valid action
    this._restartTimer();
    this._broadcast('game_state', this._stateSnapshot());
    return { ok: true };
  }

  handleMove(socketId, row, col) {
    if (this.phase !== 'move') return { error: 'Nicht in der Bewegungsrunde' };
    const cp = this.players[this.currentIdx];
    if (!cp || cp.id !== socketId) return { error: 'Nicht dein Zug' };
    if (!this.reachable.some(([r, c]) => r === row && c === col)) return { error: 'Feld nicht erreichbar' };

    cp.position = { row, col };

    // Check card collection
    const targetCard = cp.cards[cp.currentCardIndex];
    if (targetCard != null && this.board[row][col].person === targetCard) {
      cp.currentCardIndex++;
    }
    if (cp.currentCardIndex >= cp.cards.length) cp.foundAll = true;

    // Check win condition
    if (cp.foundAll && row === cp.startPosition.row && col === cp.startPosition.col) {
      this._stopTimer();
      this.winner = this.currentIdx;
      this.phase  = 'end';
      this._broadcast('game_state', this._stateSnapshot());
      return { ok: true };
    }

    cp.timeouts = 0;
    this._advanceTurn();
    return { ok: true };
  }

  handleRotateExtra(socketId, rotation) {
    if (this.phase !== 'push') return { error: 'Nicht in der Schieberunde' };
    const cp = this.players[this.currentIdx];
    if (!cp || cp.id !== socketId) return { error: 'Nicht dein Zug' };
    this.extraTile = { ...this.extraTile, rotation, connections: getConnections(this.extraTile.type, rotation) };
    this._broadcast('game_state', this._stateSnapshot());
    return { ok: true };
  }

  // ── Chat & Votekick ──────────────────────────────────────────────────────────

  handleChat(socketId, message) {
    const player = this.players.find(p => p.id === socketId);
    if (!player) return;
    const msg = { from: player.name, message: message.slice(0, 200), timestamp: Date.now(), system: false };
    this.chat.push(msg);
    if (this.chat.length > 100) this.chat.shift();
    this._broadcast('chat_message', msg);
  }

  handleVoteKick(voterId, targetId) {
    const voter  = this.players.find(p => p.id === voterId);
    const target = this.players.find(p => p.id === targetId);
    if (!voter || !target || targetId === voterId) return;
    if (!target.connected) return;

    // Host instant-kick in private matches
    if (this.isPrivate && voterId === this.hostId) {
      this._kickPlayer(targetId);
      return;
    }

    if (!this.votekick[targetId]) this.votekick[targetId] = new Set();
    if (this.votekick[targetId].has(voterId)) return; // already voted
    this.votekick[targetId].add(voterId);

    const votes   = this.votekick[targetId].size;
    const others  = this.players.filter(p => p.connected && p.id !== targetId).length;
    const needed  = Math.ceil(others / 2);
    const remaining = needed - votes;

    if (remaining <= 0) {
      this._kickPlayer(targetId);
    } else {
      this._systemChat(`🗳️ Abstimmung gegen ${target.name}: noch ${remaining} Stimme(n) nötig`);
    }
  }

  // ── Timer ────────────────────────────────────────────────────────────────────

  _startTimer() {
    this.timeLeft = this.config.turnTime;
    this._stopTimer();
    this.timerInterval = setInterval(() => this._tick(), 1000);
  }

  _restartTimer() {
    this._startTimer();
  }

  _stopTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  _tick() {
    this.timeLeft--;
    this._broadcast('timer_tick', { timeLeft: this.timeLeft });

    if (this.timeLeft <= 0) {
      this._stopTimer();
      this._handleTimeout();
    }
  }

  _handleTimeout() {
    const cp = this.players[this.currentIdx];
    if (!cp) return;
    cp.timeouts++;

    if (cp.timeouts >= 2) {
      // Kick after 2nd consecutive timeout
      this._systemChat(`⏱️ ${cp.name} wurde wegen Inaktivität entfernt.`);
      this._kickPlayer(cp.id);
      return;
    }

    this._systemChat(`⏱️ ${cp.name} hat den Zug nicht ausgeführt (${cp.timeouts}/2).`);
    const savedTimeouts = cp.timeouts;

    if (this.phase === 'push') {
      const positions = getAllPushPositions(this.lastPush);
      const pick = positions[Math.floor(Math.random() * positions.length)];
      this.handlePush(cp.id, pick.side, pick.index, null);
      // handlePush resets timeouts to 0 — restore so the upcoming move-phase
      // timeout counts as the 2nd miss and triggers a kick
      const p = this.players.find(p => p.id === cp.id);
      if (p) p.timeouts = savedTimeouts;
    } else if (this.phase === 'move') {
      this.handleMove(cp.id, cp.position.row, cp.position.col);
    }
  }

  _skipCurrentTurn() {
    if (this.phase === 'push') {
      const cp = this.players[this.currentIdx];
      if (!cp) return;
      const positions = getAllPushPositions(this.lastPush);
      const pick = positions[Math.floor(Math.random() * positions.length)];
      this.handlePush(cp.id, pick.side, pick.index, null);
    } else if (this.phase === 'move') {
      const cp = this.players[this.currentIdx];
      if (cp) this.handleMove(cp.id, cp.position.row, cp.position.col);
    }
  }

  _advanceTurn() {
    const total = this.players.length;
    let next = (this.currentIdx + 1) % total;
    let guard = 0;
    while (!this.players[next].connected && guard++ < total) {
      next = (next + 1) % total;
    }
    this.currentIdx = next;
    this.phase = 'push';
    this.reachable = [];
    this._restartTimer();
    this._broadcast('game_state', this._stateSnapshot());
  }

  // ── Kick ─────────────────────────────────────────────────────────────────────

  _kickPlayer(targetId) {
    const target = this.players.find(p => p.id === targetId);
    if (!target) return;

    target.connected = false;
    this.bannedSessions.add(target.sessionToken);
    delete this.votekick[targetId];

    this._systemChat(`🚫 ${target.name} wurde aus der Lobby entfernt.`);
    this.io.to(targetId).emit('you_were_kicked');
    this.io.in(this.code || 'public-' + this.code).socketsLeave(this.code || '');

    // Check if game can continue
    const connected = this.players.filter(p => p.connected).length;
    if (this.phase !== 'waiting' && connected < 2) {
      this._endByAbandonment();
      return;
    }

    // If it was the kicked player's turn
    if (this.phase !== 'waiting' && this.phase !== 'end') {
      const cp = this.players[this.currentIdx];
      if (cp && cp.id === targetId) this._advanceTurn();
    }

    this._broadcast('player_kicked', { kickedName: target.name, players: this._publicPlayers() });
  }

  _endByAbandonment() {
    this._stopTimer();
    this.phase  = 'end';
    this.winner = null;
    this._broadcast('game_state', this._stateSnapshot());
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  _systemChat(message) {
    const msg = { from: null, message, timestamp: Date.now(), system: true };
    this.chat.push(msg);
    if (this.chat.length > 100) this.chat.shift();
    this._broadcast('chat_message', msg);
  }

  _broadcast(event, data) {
    this.io.to(this._roomId()).emit(event, data);
  }

  _roomId() {
    return this.code ?? `room-${this.players[0]?.id}`;
  }

  _publicPlayers() {
    return this.players.map(({ id, name, color, position, startPosition, currentCardIndex, cards, foundAll, connected }) => ({
      id, name, color, position, startPosition,
      cardCount: cards.length,
      currentCardIndex, foundAll, connected,
      cards,
    }));
  }

  _stateSnapshot() {
    return {
      phase:            this.phase,
      board:            this.board,
      extraTile:        this.extraTile,
      players:          this._publicPlayers(),
      currentPlayerIndex: this.currentIdx,
      lastPush:         this.lastPush,
      winner:           this.winner,
      reachableTiles:   this.reachable,
      newTilePos:       this.newTilePos,
      timeLeft:         this.timeLeft,
      config:           this.config,
      isPrivate:        this.isPrivate,
    };
  }

  updateConfig(hostId, config) {
    if (hostId !== this.hostId) return { error: 'Nur der Host kann die Einstellungen ändern' };
    if (this.phase !== 'waiting') return { error: 'Spiel läuft bereits' };
    this.config = { ...this.config, ...config };
    this._broadcast('lobby_updated', { players: this._publicPlayers(), config: this.config });
    return { ok: true };
  }

  destroy() {
    this._stopTimer();
  }
}

module.exports = GameRoom;
