import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sessionsRouter } from './routes/sessions.js';
import { attachWebSocket } from './ws/ws-server.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const frontendDist = path.join(projectRoot, 'frontend', 'dist');

export function createApp() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/sessions', sessionsRouter);
  app.use(express.static(frontendDist));
  app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/api') || _req.path === '/health' || _req.path.startsWith('/sessions')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (error) => error && next());
  });
  return app;
}

const app = createApp();
const server = http.createServer(app);
attachWebSocket(server);
const port = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV !== 'test') server.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
export { app, server };
