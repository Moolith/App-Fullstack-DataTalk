import { useEffect, useRef, useState } from 'react';
import SessionManager from './components/SessionManager.jsx';
import EditorPanel from './components/EditorPanel.jsx';
import ConsoleOutput from './components/ConsoleOutput.jsx';
import ParticipantsList from './components/ParticipantsList.jsx';
import { runCodeInBrowser } from './services/codeRunner.js';
import * as Y from 'yjs';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
const encodeUpdate = (update) => {
  let binary = '';
  for (const byte of update) binary += String.fromCharCode(byte);
  return btoa(binary);
};
const starters = {
  javascript: "function solve(input) {\n  return input.trim();\n}\n\nconsole.log(solve('hello interview'));",
  python: "def solve(input_text):\n    return input_text.strip()\n\nprint(solve('hello interview'))",
  java: "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"hello interview\");\n  }\n}"
};

export default function App() {
  const [session, setSession] = useState(null);
  const [code, setCode] = useState(starters.javascript);
  const [output, setOutput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState([]);
  const socket = useRef(null);
  const documentRef = useRef(null);
  const codeTextRef = useRef(null);
  useEffect(() => () => socket.current?.close(), []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    const token = params.get('token');
    if (!sessionId || !token) return;
    fetch(`${API}/sessions/${sessionId}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Session not found')))
      .then((metadata) => connect({ ...metadata, sessionId, shareUrl: window.location.href, roleToken: token }))
      .catch((loadError) => setError(loadError.message));
  }, []);
  function connect(created) {
    setError('');
    setSession(created);
    setParticipants([]);
    setCode(starters[created.language] || '');
    const document = new Y.Doc();
    const codeText = document.getText('code');
    documentRef.current = document;
    codeTextRef.current = codeText;
    document.on('update', (update, origin) => {
      if (origin === 'remote') return;
      sendSocketMessage({ type: 'crdt-update', update: encodeUpdate(update) });
    });
    const wsUrl = API.replace(/^http/, 'ws') + `/ws?session=${created.sessionId}&token=${encodeURIComponent(created.roleToken)}`;
    socket.current?.close();
    socket.current = new WebSocket(wsUrl);
    setConnectionStatus('connecting');
    socket.current.onopen = () => setConnectionStatus('connected');
    socket.current.onerror = () => {
      setConnectionStatus('error');
      setError('The realtime connection could not be established.');
    };
    socket.current.onclose = () => setConnectionStatus('disconnected');
    socket.current.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.type === 'editor-update') setCode(message.code);
      if (message.type === 'execution-output') setOutput(message.output);
      if (message.type === 'crdt-sync' || message.type === 'crdt-update') {
        Y.applyUpdate(document, Uint8Array.from(atob(message.update), (character) => character.charCodeAt(0)), 'remote');
        setCode(codeText.toString());
      }
      if (message.type === 'participant-self' && message.participant.role === 'interviewer' && codeText.length === 0) document.transact(() => codeText.insert(0, starters[created.language] || ''), 'local');
      if (message.type === 'participant-self' || message.type === 'participant-join') setParticipants((current) => current.some((item) => item.id === message.participant.id) ? current : [...current, message.participant]);
      if (message.type === 'participant-leave') setParticipants((current) => current.filter((item) => item.id !== message.participantId));
    };
  }
  function changeCode(next) {
    setCode(next);
    const codeText = codeTextRef.current;
    if (codeText && codeText.toString() !== next) documentRef.current.transact(() => {
      codeText.delete(0, codeText.length);
      codeText.insert(0, next);
    }, 'local');
  }
  function sendSocketMessage(message) {
    const socketInstance = socket.current;
    if (!socketInstance) return;
    const send = () => socketInstance.send(JSON.stringify(message));
    if (socketInstance.readyState === WebSocket.OPEN) send();
    else if (socketInstance.readyState === WebSocket.CONNECTING) socketInstance.addEventListener('open', send, { once: true });
  }
  async function run() {
    const result = await runCodeInBrowser({ code, language: session.language, timeout: 1000 });
    const text = result.stdout || result.stderr;
    setOutput(text);
    sendSocketMessage({ type: 'execution-output', output: text });
  }
  if (!session) return <main className="landing"><div className="kicker">PAIR / LIVE / 01</div><h1>Make the interview<br /><em>shared.</em></h1><p className="lede">A focused room for thinking out loud, shaping code together, and keeping the signal visible.</p>{error && <p role="alert" className="error">{error}</p>}<SessionManager onCreated={connect} onError={setError} /></main>;
  return <main className="workspace"><header><div><div className="kicker">LIVE ROOM</div><h1>{session.sessionId}</h1></div><div className="share">{session.shareUrl}<button onClick={() => navigator.clipboard.writeText(session.shareUrl)}>Copy</button></div></header>{error && <p role="alert" className="error">{error}</p>}<div className="toolbar"><span>● {connectionStatus}</span><label>Timeout <input defaultValue="1000" type="number" /></label><button onClick={run}>Run code</button></div><div className="layout"><div><EditorPanel language={session.language} code={code} onChange={changeCode} /><ConsoleOutput output={output} /></div><ParticipantsList participants={participants} /></div></main>;
}
