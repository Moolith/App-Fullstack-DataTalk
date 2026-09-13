import vm from 'node:vm';

const SUPPORTED = new Set(['javascript', 'javascriptreact', 'js']);

export function executeCode({ code, language = 'javascript', stdin = '', timeout = 1000 }) {
  if (!SUPPORTED.has(language)) {
    return { stdout: '', stderr: `Language ${language} requires a dedicated sandbox adapter.`, exitCode: 2, durationMs: 0 };
  }
  const started = Date.now();
  const output = [];
  const context = vm.createContext({
    console: { log: (...args) => output.push(args.map(String).join(' ')) },
    stdin
  });
  try {
    new vm.Script(code).runInContext(context, { timeout: Math.min(Number(timeout) || 1000, 5000) });
    return { stdout: output.join('\n'), stderr: '', exitCode: 0, durationMs: Date.now() - started };
  } catch (error) {
    return { stdout: output.join('\n'), stderr: error.message, exitCode: 1, durationMs: Date.now() - started };
  }
}
