# Automatic agents

The scaffold reserves these workers as production extensions:

- `session-cleanup`: periodically deletes expired ephemeral sessions. Interface: `run(now): Promise<{deleted:number}>`.
- `execution-worker`: accepts `{sessionId, code, language, stdin, timeout}` and returns `{stdout, stderr, exitCode, durationMs}`. It must run outside the API process with network disabled, CPU/memory cgroups, read-only filesystem, and a hard wall-clock timeout.
- `evaluation-worker`: consumes a versioned session snapshot and test suite, then emits an audit event with score and diagnostics.
- `resource-monitor`: exports execution latency, memory, CPU and WebSocket fan-out metrics.

Workers should use an authenticated queue, idempotency keys, structured JSON logs and least-privilege credentials. No worker is started by this demo.
