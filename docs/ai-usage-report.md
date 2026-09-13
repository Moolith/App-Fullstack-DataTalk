# AI usage report

This scaffold was generated with AI assistance from the requested architecture brief. AI-generated areas include:

- repository manifests and Vite setup;
- Express routes, in-memory session service, WebSocket fan-out and VM demo runner;
- React room flow, Monaco editor integration, console and participant components;
- OpenAPI contract, tests, product specification and agent notes.
- Dockerfile, Render deployment manifest and browser execution Worker using Pyodide.

## Manual review required

1. Replace the Node `vm` demo with a separately provisioned sandbox. `vm` is not a complete hostile-code isolation boundary.
2. Add authenticated, signed role tokens with expiry and permission checks on REST and WebSocket connections.
3. Replace in-memory state with PostgreSQL migrations, snapshots and append-only audit events.
4. Replace whole-document WebSocket messages with Yjs updates and test concurrent edits, reconnects and offline recovery.
5. Set a strict production CSP, HSTS behind TLS, origin allow-list, CSRF strategy and secure cookie/token policy.
6. Add container image pinning, network namespace isolation, cgroups, filesystem limits, cancellation and output quotas.
7. Run dependency audit, OpenAPI validation, accessibility checks, browser matrix tests and load tests for the 200ms latency target.

8. Review the browser execution path in `frontend/src/workers/codeRunner.worker.js`: Pyodide is loaded from a pinned CDN version, but production should self-host and integrity-pin the WASM assets. JavaScript execution in the Worker is not equivalent to a security sandbox.

9. The frontend now derives the API and WebSocket origin from the deployed page when `VITE_API_URL` is absent. Verify this behavior behind the production reverse proxy and configure `VITE_API_URL` only for split-origin deployments.

The included tests prove the local contract only; they are not a security certification or production readiness assessment.
