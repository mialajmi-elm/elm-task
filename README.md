# elm-tasks

A small task tracker for a coding-agent knowledge-sharing session: a React frontend, TanStack Start server routes, SQLite, and meaningful tests. Everything runs locally in one server process.

## Quick start

Requires **Node 22.13 or newer**. Tested on Node 22.23.3. Node 22 prints an expected experimental SQLite warning.

```sh
npm ci
npm run seed
npm run dev
```

Open http://127.0.0.1:3000. TanStack Start runs the frontend and API together with hot reload. For a production build, run `npm run build` followed by `npm start`.

## Features

Create, rename, complete, reopen, search, filter, and delete tasks. SQLite preserves tasks across restarts. The UI includes validation errors, empty states, a confirmation before deletion, and a responsive layout.

## Tests

```sh
npm test
npm run test:coverage
npx playwright install chromium
npm run test:e2e
npm run test:all
```

- Validation and UI logic unit tests.
- Real SQLite tests, including persistence after reopening the file.
- Fetch API handler tests for the task lifecycle, invalid input, malformed JSON, missing records, request limits, and errors.
- Browser tests against the production TanStack server for the complete user workflow, search, failed requests, input safety, and mobile layout.

Tests use in-memory databases or temporary files. Browser tests start their own server on **3100**, separate from the demo on **3000**. They do not erase demo data.

## API

| Method | Route            | Result                            |
| ------ | ---------------- | --------------------------------- |
| GET    | `/api/health`    | Health status                     |
| GET    | `/api/tasks`     | Newest-first list                 |
| POST   | `/api/tasks`     | Create with `{title, completed?}` |
| GET    | `/api/tasks/:id` | Read one task                     |
| PATCH  | `/api/tasks/:id` | Change `title` and/or `completed` |
| DELETE | `/api/tasks/:id` | Delete, returning 204             |

Titles are trimmed, required, and limited to 120 characters. Completion must be boolean. Errors use `{error: "message"}`. The API serves all tasks and the frontend performs search and filtering.

## Project map

```text
src/routes/         TanStack page and API routes
src/router.tsx      TanStack Router configuration
src/routes/index.tsx React UI with TanStack Query caching/mutations
src/styles.css      Responsive styles
src/view.js         Pure filtering and summary logic
src/server/         Fetch API handlers and server-only database connection
src/database.js     SQLite schema and repository
src/validation.js   Request validation
scripts/serve.js    Production Node adapter serving the Start build
scripts/seed.js     Non-destructive sample data
tests/              Unit, DB, and API handler tests
tests/e2e/          Playwright browser and HTTP tests
AGENTS.md           Instructions for coding agents
DEMO.md             Live-demo prompts and acceptance criteria
```

Default database: `data/tasks.sqlite`. Override with `DB_PATH`. For the production server, override the port with `PORT` (PowerShell example: `$env:PORT='3001'; npm start`). For the development server, use `npm run dev -- --port 3001`. For a fresh rehearsal, use a new DB_PATH instead of deleting existing data.

This is a single-user local demo, with no authentication or multi-user authorization. It binds to loopback. Deploying it as a shared service would require additional controls.

## Demo

See [DEMO.md](DEMO.md) for a feature request designed to touch the frontend, API, database, and tests. The baseline deliberately starts with passing tests, not a planted bug.
