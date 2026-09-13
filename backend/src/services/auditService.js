const events = [];

export function audit(event, details = {}) {
  const entry = { event, details, timestamp: new Date().toISOString() };
  events.push(entry);
  console.info(JSON.stringify(entry));
  return entry;
}

export function listAuditEvents() {
  return [...events];
}

export function clearAuditEvents() {
  events.length = 0;
}
