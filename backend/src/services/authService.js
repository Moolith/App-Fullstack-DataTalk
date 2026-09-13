import crypto from 'node:crypto';

const secret = () => process.env.SESSION_TOKEN_SECRET || 'development-only-change-me';

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function issueRoleToken(sessionId, role, expiresAt) {
  const payload = encode({ sessionId, role, expiresAt });
  const signature = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyRoleToken(token, sessionId) {
  if (!token || typeof token !== 'string') return undefined;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return undefined;
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.sessionId !== sessionId || Date.parse(data.expiresAt) <= Date.now()) return undefined;
    return data;
  } catch {
    return undefined;
  }
}
