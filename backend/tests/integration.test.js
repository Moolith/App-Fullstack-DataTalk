import request from 'supertest';
import { app } from '../src/index.js';

test('health endpoint is available', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('ok');
});
