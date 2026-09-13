export function runCodeInBrowser({ code, language, timeout = 1000 }) {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('../workers/codeRunner.worker.js', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ stdout: '', stderr: 'Execution timed out in browser worker.', exitCode: 124 });
    }, Math.min(Number(timeout) || 1000, 5000));
    worker.onmessage = ({ data }) => {
      if (data.type !== 'result') return;
      clearTimeout(timer);
      worker.terminate();
      resolve(data);
    };
    worker.onerror = (error) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ stdout: '', stderr: error.message || 'Browser worker failed.', exitCode: 1 });
    };
    worker.postMessage({ code, language });
  });
}
