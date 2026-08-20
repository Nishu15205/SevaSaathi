/**
 * Helper to emit events via the realtime Socket.io service.
 * The service runs on port 3005 and exposes POST /api/emit
 */
export async function emitToUser(userId: string, event: string, data: any) {
  try {
    await fetch(`/?XTransformPort=3005/api/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, event, data }),
    });
  } catch (err) {
    console.error(`Socket emit error (${event} -> ${userId}):`, err);
  }
}

export async function emitToRoom(room: string, event: string, data: any) {
  try {
    await fetch(`/?XTransformPort=3005/api/emit-room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, event, data }),
    });
  } catch (err) {
    console.error(`Socket room emit error (${event} -> ${room}):`, err);
  }
}
