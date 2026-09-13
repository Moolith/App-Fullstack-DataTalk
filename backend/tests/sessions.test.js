import request from 'supertest';
import { app } from '../src/index.js';
import { clearSessions } from '../src/services/sessionService.js';

afterEach(() => clearSessions());

test('creates and reads a session', async () => {
  const created = await request(app).post('/sessions').send({ title: 'Two sum', language: 'javascript' });
  expect(created.status).toBe(201);
  const response = await request(app).get(`/sessions/${created.body.sessionId}`);
  expect(response.body.title).toBe('Two sum');
});

test('executes bounded javascript and returns output', async () => {
  const created = await request(app).post('/sessions').send({ title: 'Run', language: 'javascript' });
  const response = await request(app).post(`/sessions/${created.body.sessionId}/execute`).send({ code: "console.log('hello')", language: 'javascript' });
  expect(response.body).toMatchObject({ stdout: 'hello', exitCode: 0 });
});
