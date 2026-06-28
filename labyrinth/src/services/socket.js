import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Session token persists across page refreshes for lobby-ban tracking
function getSessionToken() {
  let token = localStorage.getItem('labyrinth_session');
  if (!token) { token = uuidv4(); localStorage.setItem('labyrinth_session', token); }
  return token;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? '';

let _socket = null;

export function getSocket() {
  if (!_socket) {
    _socket = io(SERVER_URL, { autoConnect: false, reconnectionAttempts: 5 });
  }
  return _socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (_socket?.connected) _socket.disconnect();
}

export { getSessionToken };
