# Product spec: Pair / Live

## User stories
- As an interviewer, I create a room and share a role-aware link.
- As a candidate, I join without an account and see the same editor state.
- As both participants, I edit code and see peer updates in real time.
- As an interviewer, I run the current solution and share stdout/stderr.

## Acceptance criteria
1. `POST /sessions` returns a session id, candidate share URL, and signed interviewer/candidate role tokens.
2. WebSocket messages scoped to a session are broadcast to every other client.
3. Monaco provides JavaScript, Python, and Java syntax modes.
4. JavaScript and Python execution run in a browser Worker; Python uses Pyodide/WebAssembly and unsupported languages fail explicitly.
5. API, frontend unit, integration, and Playwright smoke tests are available.

## Text wireframe
- Landing: product mark, short value proposition, title/language form, create button.
- Room header: room id, share link, copy action, connection state.
- Main: Monaco editor on the left, shared console below, participant rail on the right.

## Architecture decisions
The demo uses WebSocket message broadcasting with an `editor-update` envelope. Browser execution is implemented in a Worker; Python uses Pyodide loaded from a pinned CDN version. A production implementation should replace whole-document messages with Yjs updates, persist snapshots/events in PostgreSQL, self-host the WASM assets, and enforce signed role permissions.

## Roadmap
- Phase 1: role token validation, Yjs provider, Postgres repository and audit table.
- Phase 2: isolated Firecracker/container runner for Python and Java, quotas, cancellation.
- Phase 3: authentication, interviewer dashboard, replayable history, metrics and tracing.
