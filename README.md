# Pair / Live

Working scaffold for real-time collaborative coding interviews.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Install

From the repository root:

```bash
npm run install:all
```

This installs dependencies in both `backend/` and `frontend/`.

## Run the application

Run both services from the repository root with one command:

```bash
npm run dev
```

This uses `concurrently` to start the backend and frontend together. To run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

Open <http://localhost:5173>. The API runs at <http://localhost:3000>.

### Port 3000 already in use

If `npm run dev` reports `Failed running 'src/index.js'`, check whether the Docker container is already using port `3000`:

```bash
docker ps
```

Stop that container and start the development services:

```bash
docker stop <container-id>
npm run dev
```

Alternatively, keep the container running and start only the Vite frontend:

```bash
npm run dev:frontend
```

In this case open <http://localhost:5173>; the frontend uses the backend already available at <http://localhost:3000>.

## Using the app

1. Open the frontend URL and enter an interview title.
2. Select JavaScript, Python, or Java and choose **Create session link**.
3. Copy the generated share URL and send it to the other participant.
4. The creator receives the interviewer token; the copied URL contains the candidate token and can be opened by the candidate.
5. Edit the Monaco editor. Changes are sent to other authenticated clients in the same room through WebSocket.
6. Use **Run code** to execute JavaScript or Python in a browser Web Worker. Python loads Pyodide/WebAssembly on its first run, so the first execution can take longer. Java is currently an editor mode only.
7. Read the shared stdout/stderr in **Shared console**. The connection indicator shows `connecting`, `connected`, `disconnected`, or `error`.

The development frontend uses `http://localhost:3000` for the API. In a production build it uses the same origin as the page; set `VITE_API_URL` only when frontend and backend are deployed on different origins. Use HTTPS in production so browser WebSocket connections use `wss://`. Set a strong `SESSION_TOKEN_SECRET` in any non-local environment; Render generates one through `render.yaml`.

## Run with Docker

The single image builds the Vite frontend and serves it from the Express backend, including REST and WebSocket support:

```bash
docker build -t coding-interviews .
docker run --rm -p 3000:3000 coding-interviews
```

Open <http://localhost:3000>. The Dockerfile uses `node:20-bookworm-slim` for both the build and runtime stages. The runtime image runs as the non-root `node` user.

## Deploy with Render

This repository includes [render.yaml](render.yaml) for a Docker-based Render web service.

1. Push the repository to GitHub or GitLab.
2. In Render, choose **New > Blueprint** and select the repository.
3. Render reads `render.yaml`, builds the Docker image, and deploys the web service.
4. Verify the deployed URL with `/health`.

The service is configured to use the `PORT` environment variable and exposes the frontend, REST API, and WebSocket endpoint from the same deployed URL.

You can also run the packages directly:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Test commands

The shortest command for the complete automated test suite is:

```bash
npm test
```

Individual commands:

```bash
# Backend unit and REST integration tests
npm run test:backend

# Frontend component tests
npm run test:frontend

# Real client-server HTTP + WebSocket integration test
npm run test:integration

# All backend and frontend tests
npm run test:all

# Production frontend build
npm run build
```

The client-server integration test starts the real HTTP server, creates a session, fetches metadata, authenticates two WebSocket clients with role tokens, verifies participant join, relays legacy output, verifies a Yjs CRDT update, executes code, and verifies shared execution output.

## End-to-end test

Install the Playwright browser once:

```bash
cd frontend
npx playwright install --with-deps chromium
cd ..
```

Then run the E2E smoke test. It starts Vite automatically:

```bash
npm run test:e2e
```

For the E2E test to create a session, start the backend in another terminal first:

```bash
npm run dev:backend
```

## API and architecture

- REST contract: [openapi.yaml](openapi.yaml)
- Product requirements: [product-spec.md](product-spec.md)
- Worker proposals: [AGENTS.md](AGENTS.md)
- AI review notes: [docs/ai-usage-report.md](docs/ai-usage-report.md)

React + Vite + Monaco provide JavaScript, Python, and Java editor modes. Express + `ws` expose REST and `/ws`; messages are scoped by session. Yjs now synchronizes the editor as CRDT updates, while session state and CRDT documents are currently held in memory. Code execution happens in a browser Web Worker: Python uses Pyodide (CPython compiled to WebAssembly), while JavaScript uses the worker runtime. Production still needs PostgreSQL and stronger browser isolation policies.

The backend `/execute` endpoint remains available for API compatibility and tests, but the frontend no longer calls it. The browser runner has a hard client-side timeout and terminates its Worker. Pyodide assets are loaded from the jsDelivr CDN on first Python execution. A Worker is not a complete hostile-code security boundary: production still requires CSP, origin isolation, output quotas, dependency pinning and careful review of browser capabilities.

