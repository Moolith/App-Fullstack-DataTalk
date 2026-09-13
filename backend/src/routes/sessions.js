import { Router } from 'express';
import { createSession, getSession, listSessions } from '../services/sessionService.js';
import { executeCode } from '../services/sandboxService.js';
import { audit } from '../services/auditService.js';

export const sessionsRouter = Router();

sessionsRouter.post('/', (req, res) => {
  const { title, language, expiresIn, persistent } = req.body || {};
  if (!title || !language) return res.status(400).json({ error: 'title and language are required' });
  const result = createSession({ title, language, expiresIn, persistent }, `${req.protocol}://${req.get('host')}`);
  audit('session.created', { sessionId: result.sessionId, language, persistent: Boolean(persistent) });
  res.status(201).json(result);
});

sessionsRouter.get('/', (_req, res) => res.json({ sessions: listSessions() }));

sessionsRouter.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

sessionsRouter.post('/:id/execute', (req, res) => {
  if (!getSession(req.params.id)) return res.status(404).json({ error: 'Session not found' });
  const { code, language, stdin, timeout } = req.body || {};
  if (typeof code !== 'string') return res.status(400).json({ error: 'code is required' });
  const result = executeCode({ code, language, stdin, timeout });
  audit(result.exitCode === 0 ? 'execution.completed' : 'execution.failed', { sessionId: req.params.id, language, exitCode: result.exitCode, durationMs: result.durationMs });
  res.json(result);
});
