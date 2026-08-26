'use client';

import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useCallback } from 'react';

// Connect to socket.io service through the gateway proxy
const SOCKET_URL = '/?XTransformPort=3005';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function useSocket(userId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const s = getSocket();
    socketRef.current = s;

    // Join user's personal room
    if (s.connected) {
      s.emit('join', userId);
    }

    const handleConnect = () => {
      console.log('[Socket] Connected');
      s.emit('join', userId);
    };

    const handleDisconnect = () => {
      console.log('[Socket] Disconnected');
    };

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.emit('leave', userId);
    };
  }, [userId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const s = socketRef.current || getSocket();
    s.on(event, handler);
    return () => {
      s.off(event, handler);
    };
  }, []);

  return { on };
}
