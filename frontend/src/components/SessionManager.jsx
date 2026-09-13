import { useState } from 'react';

export default function SessionManager({ onCreated, onError }) {
  const [title, setTitle] = useState('Frontend pairing');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  async function create() {
    setLoading(true);
    try {
      const api = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
      const response = await fetch(`${api}/sessions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, language, expiresIn: 120, persistent: false })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to create session');
      onCreated(result);
    } catch (error) {
      onError?.(error.message);
    } finally { setLoading(false); }
  }
  return <section className="session-form">
    <label>Interview title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="javascript">JavaScript</option><option value="python">Python</option><option value="java">Java</option></select></label>
    <button onClick={create} disabled={loading}>{loading ? 'Creating...' : 'Create session link'}</button>
  </section>;
}
