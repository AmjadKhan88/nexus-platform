import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  const token = localStorage.getItem('nexus_token');
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => console.log('🟢 Socket connected'));
  socket.on('disconnect', () => console.log('🔴 Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
