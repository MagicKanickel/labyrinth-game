const { v4: uuidv4 } = require('uuid');
const GameRoom = require('./GameRoom');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

class LobbyManager {
  constructor(io) {
    this.io    = io;
    this.rooms = new Map(); // code → GameRoom
  }

  createPrivate(hostSocketId, hostName, sessionToken, config) {
    let code;
    do { code = generateCode(); } while (this.rooms.has(code));

    const room = new GameRoom({ code, isPrivate: true, hostId: hostSocketId, config, io: this.io });
    room.addPlayer(hostSocketId, hostName, sessionToken);
    this.rooms.set(code, room);
    return room;
  }

  joinPrivate(socketId, name, sessionToken, code) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room)          return { error: 'Lobby nicht gefunden' };
    if (!room.isPrivate) return { error: 'Kein privates Spiel' };
    if (room.isBanned(sessionToken)) return { error: 'Du wurdest aus dieser Lobby entfernt' };
    if (room.isFull())  return { error: 'Lobby ist voll' };
    if (room.phase !== 'waiting') return { error: 'Spiel läuft bereits' };

    room.addPlayer(socketId, name, sessionToken);
    return { room };
  }

  getRoom(code) {
    return this.rooms.get(code);
  }

  removeRoom(code) {
    const room = this.rooms.get(code);
    if (room) { room.destroy(); this.rooms.delete(code); }
  }

  findRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === socketId)) return room;
    }
    return null;
  }
}

module.exports = LobbyManager;
