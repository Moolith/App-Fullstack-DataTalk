export default function ConsoleOutput({ output }) {
  return <section className="console"><div className="section-label">Shared console</div><pre>{output || 'Run code to see output here.'}</pre></section>;
}
