import { nanoid } from 'nanoid';
import { issueRoleToken } from './authService.js';

const sessions = new Map();

export function createSession(input, origin = 'http://localhost:5173') {
  const id = nanoid(10);
  const session = {
    id,
    title: input.title,
    language: input.language,
    persistent: Boolean(input.persistent),
    expiresAt: new Date(Date.now() + Number(input.expiresIn || 120) * 60_000).toISOString(),
    createdAt: new Date().toISOString(),
    code: '',
    participants: []
  };
  sessions.set(id, session);
  const roleToken = issueRoleToken(id, 'interviewer', session.expiresAt);
  const candidateToken = issueRoleToken(id, 'candidate', session.expiresAt);
  return {
    sessionId: id,
    shareUrl: `${origin}/?session=${id}&token=${candidateToken}`,
    roleToken,
    candidateToken
  };
}

export function getSession(id) {
  return sessions.get(id);
}

export function listSessions() {
  return [...sessions.values()].map(({ code, ...metadata }) => metadata);
}

export function updateSession(id, patch) {
  const session = sessions.get(id);
  if (!session) return undefined;
  Object.assign(session, patch);
  return session;
}

export function clearSessions() {
  sessions.clear();
}
