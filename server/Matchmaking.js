const { v4: uuidv4 } = require('uuid');
const GameRoom = require('./GameRoom');

const QUEUE_MAX      = 4;
const QUEUE_MIN      = 2;
const WAIT_SECONDS   = 45; // start game after this if < QUEUE_MAX

class Matchmaking {
  constructor(io, lobbyManager) {
    this.io           = io;
    this.lobbyManager = lobbyManager;
    this.queue        = []; // { socketId, name, sessionToken }
    this.countdown    = null;
    this.timeLeft     = 0;
  }

  join(socketId, name, sessionToken) {
    if (this.queue.some(p => p.socketId === socketId)) return;
    this.queue.push({ socketId, name, sessionToken });
    this._broadcastStatus();

    if (this.queue.length >= QUEUE_MAX) {
      this._startGame();
    } else if (this.queue.length >= QUEUE_MIN && !this.countdown) {
      this._startCountdown();
    }
  }

  leave(socketId) {
    this.queue = this.queue.filter(p => p.socketId !== socketId);
    this._broadcastStatus();

    if (this.queue.length < QUEUE_MIN) {
      this._stopCountdown();
    }
  }

  _broadcastStatus() {
    for (const p of this.queue) {
      this.io.to(p.socketId).emit('matchmaking_update', {
        position:  this.queue.findIndex(q => q.socketId === p.socketId) + 1,
        total:     this.queue.length,
        countdown: this.countdown ? this.timeLeft : null,
      });
    }
  }

  _startCountdown() {
    this.timeLeft = WAIT_SECONDS;
    this.countdown = setInterval(() => {
      this.timeLeft--;
      this._broadcastStatus();
      if (this.timeLeft <= 0) this._startGame();
    }, 1000);
  }

  _stopCountdown() {
    if (this.countdown) { clearInterval(this.countdown); this.countdown = null; }
  }

  _startGame() {
    this._stopCountdown();
    const players = this.queue.splice(0, QUEUE_MAX);
    if (players.length < QUEUE_MIN) return;

    // Build a public room (no code, use a uuid as room key)
    const roomKey = `pub-${uuidv4().slice(0, 8)}`;
    const room = new GameRoom({
      code: roomKey,
      isPrivate: false,
      hostId: null,
      config: { maxPlayers: QUEUE_MAX, cardsPerPlayer: 4, turnTime: 30, personsCount: 12 },
      io: this.io,
    });

    for (const p of players) {
      room.addPlayer(p.socketId, p.name, p.sessionToken);
      this.lobbyManager.rooms.set(roomKey, room);
    }

    // Join all sockets to the room
    for (const p of players) {
      const socket = this.io.sockets.sockets.get(p.socketId);
      if (socket) socket.join(roomKey);
    }

    room.startGame();
    this._broadcastStatus();
  }
}

module.exports = Matchmaking;
