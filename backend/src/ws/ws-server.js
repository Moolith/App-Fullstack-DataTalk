import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { getSession } from '../services/sessionService.js';
import { verifyRoleToken } from '../services/authService.js';

export function attachWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const documents = new Map();
  wss.on('connection', (socket, request) => {
    const url = new URL(request.url, 'http://localhost');
    const sessionId = url.searchParams.get('session');
    const role = verifyRoleToken(url.searchParams.get('token'), sessionId);
    if (!getSession(sessionId) || !role) return socket.close(1008, 'Invalid session token');
    socket.sessionId = sessionId;
    const document = documents.get(sessionId) || new Y.Doc();
    documents.set(sessionId, document);
    socket.document = document;
    socket.participant = { id: `${role.role}-${Math.random().toString(36).slice(2, 8)}`, role: role.role };
    socket.send(JSON.stringify({ type: 'session-metadata', sessionId }));
    socket.send(JSON.stringify({ type: 'participant-self', participant: socket.participant }));
    socket.send(JSON.stringify({ type: 'crdt-sync', update: Buffer.from(Y.encodeStateAsUpdate(document)).toString('base64') }));
    for (const client of wss.clients) {
      if (client !== socket && client.readyState === 1 && client.sessionId === sessionId) {
        client.send(JSON.stringify({ type: 'participant-join', participant: socket.participant }));
        socket.send(JSON.stringify({ type: 'participant-join', participant: client.participant }));
      }
    }
    socket.on('message', (raw) => {
      let message;
      try { message = JSON.parse(raw); } catch { return socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' })); }
      if (message.type === 'crdt-update' && typeof message.update === 'string') {
        const update = Buffer.from(message.update, 'base64');
        Y.applyUpdate(document, update);
        for (const client of wss.clients) {
          if (client !== socket && client.readyState === 1 && client.sessionId === sessionId) client.send(JSON.stringify(message));
        }
        return;
      }
      for (const client of wss.clients) {
        if (client !== socket && client.readyState === 1 && client.sessionId === sessionId) client.send(JSON.stringify(message));
      }
    });
    socket.on('close', () => {
      for (const client of wss.clients) {
        if (client.readyState === 1 && client.sessionId === sessionId) client.send(JSON.stringify({ type: 'participant-leave', participantId: socket.participant.id }));
      }
      if (![...wss.clients].some((client) => client.sessionId === sessionId)) documents.delete(sessionId);
    });
  });
  return wss;
}
