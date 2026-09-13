import { WebSocket } from 'ws';
import * as Y from 'yjs';
import request from 'supertest';
import { app, server } from '../src/index.js';
import { clearSessions } from '../src/services/sessionService.js';

function connectWebSocket(port, sessionId, token) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws?session=${sessionId}&token=${encodeURIComponent(token)}`);
    const onError = (error) => reject(error);
    socket.once('error', onError);
    socket.once('open', () => {
      socket.off('error', onError);
      resolve(socket);
    });
  });
}

function nextMessage(socket, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const onMessage = (data) => {
      const message = JSON.parse(data.toString());
      if (!predicate(message)) return;
      cleanup();
      resolve(message);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off('message', onMessage);
      socket.off('error', onError);
    };
    socket.once('message', onMessage);
    socket.once('error', onError);
  });
}

describe('client-server integration', () => {
  let port;
  let interviewer;
  let candidate;

  beforeAll(async () => {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterEach(() => {
    interviewer?.close();
    candidate?.close();
    clearSessions();
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  test('creates a room, reads it, executes code, and broadcasts edits/output', async () => {
    const api = `http://127.0.0.1:${port}`;
    const created = await request(app)
      .post('/sessions')
      .send({ title: 'Integration room', language: 'javascript' });

    expect(created.status).toBe(201);
    const sessionId = created.body.sessionId;
    const metadata = await fetch(`${api}/sessions/${sessionId}`);
    expect(metadata.status).toBe(200);
    expect((await metadata.json()).id).toBe(sessionId);

    interviewer = await connectWebSocket(port, sessionId, created.body.roleToken);
    const joinMessage = nextMessage(interviewer, (message) => message.type === 'participant-join');
    candidate = await connectWebSocket(port, sessionId, created.body.candidateToken);
    await expect(joinMessage).resolves.toMatchObject({ participant: { role: 'candidate' } });

    const editMessage = nextMessage(candidate, (message) => message.type === 'editor-update');
    interviewer.send(JSON.stringify({ type: 'editor-update', code: "console.log('shared')" }));
    await expect(editMessage).resolves.toEqual({ type: 'editor-update', code: "console.log('shared')" });

    const execution = await request(app)
      .post(`/sessions/${sessionId}/execute`)
      .send({ code: "console.log('shared')", language: 'javascript', timeout: 1000 });
    expect(execution.body).toMatchObject({ stdout: 'shared', exitCode: 0 });

    const outputMessage = nextMessage(candidate, (message) => message.type === 'execution-output');
    interviewer.send(JSON.stringify({ type: 'execution-output', output: execution.body.stdout }));
    await expect(outputMessage).resolves.toEqual({ type: 'execution-output', output: 'shared' });
  });

  test('relays Yjs CRDT updates between authenticated clients', async () => {
    const created = await request(app).post('/sessions').send({ title: 'CRDT room', language: 'javascript' });
    interviewer = await connectWebSocket(port, created.body.sessionId, created.body.roleToken);
    candidate = await connectWebSocket(port, created.body.sessionId, created.body.candidateToken);

    const updateMessage = nextMessage(candidate, (message) => message.type === 'crdt-update');
    const document = new Y.Doc();
    document.getText('code').insert(0, 'shared CRDT code');
    interviewer.send(JSON.stringify({ type: 'crdt-update', update: Buffer.from(Y.encodeStateAsUpdate(document)).toString('base64') }));
    await expect(updateMessage).resolves.toMatchObject({ type: 'crdt-update' });
  });

  test('rejects a WebSocket connection with an invalid role token', async () => {
    const created = await request(app).post('/sessions').send({ title: 'Protected room', language: 'python' });
    const invalidSocket = await connectWebSocket(port, created.body.sessionId, 'invalid-token');
    const closeCode = await new Promise((resolve) => invalidSocket.once('close', (code) => resolve(code)));
    expect(closeCode).toBe(1008);
  });
});
