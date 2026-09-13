import { loadPyodide } from 'pyodide';

let pyodidePromise;
function getPyodide() {
  pyodidePromise ||= loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' });
  return pyodidePromise;
}

self.onmessage = async ({ data }) => {
  const output = [];
  try {
    if (data.language === 'python') {
      const pyodide = await getPyodide();
      pyodide.setStdout({ batched: (value) => output.push(value) });
      pyodide.setStderr({ batched: (value) => output.push(value) });
      await pyodide.runPythonAsync(data.code);
    } else if (data.language === 'javascript') {
      const consoleProxy = { log: (...values) => output.push(values.map(String).join(' ')) };
      new Function('console', data.code)(consoleProxy);
    } else {
      throw new Error(`Browser runner does not support ${data.language} yet`);
    }
    self.postMessage({ type: 'result', stdout: output.join('\n'), stderr: '', exitCode: 0 });
  } catch (error) {
    self.postMessage({ type: 'result', stdout: output.join('\n'), stderr: error.message, exitCode: 1 });
  }
};
