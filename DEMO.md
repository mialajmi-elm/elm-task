# OpenCode demo: add task priorities

## Prepare

Run `npm ci`, `npx playwright install chromium`, `npm run seed`, and `npm run test:all` before the session. Start the app with `npm run dev` in one terminal. Open a second terminal in this repository and run `opencode`.

For a reviewable baseline, initialize Git and commit the working app if it is not already committed:

```sh
git init
git add .
git commit -m "Add elm-tasks demo baseline"
```

Use a new branch for each rehearsal. Keep the app running during the demo. The Node 22 SQLite experimental warning is expected.

## 1. Explore in Plan

> Read AGENTS.md. Explain how creating a task flows from the browser through the API into SQLite. Identify the validation code and the relevant tests. Cite file paths. Do not edit files.

## 2. Give a real feature request

> Add a priority to tasks: low, normal, or high. Default new and existing tasks to normal. Let users choose a priority when creating or editing a task, show a readable priority label, and filter by priority together with the existing status and search filters. Preserve newest-first ordering. Reject invalid priority values through the API. Propose the smallest implementation plan and tests before editing.

This naturally exercises the frontend, API, SQLite migration, validation, and tests. If time is short, omit the priority filter in the request.

## 3. Implement in Build

> Implement the agreed plan. Preserve the existing API behavior. Add a migration that works for existing databases. Add unit, database, API, and browser tests for the new behavior. Run npm run test:all and report any failures accurately.

## 4. Review the evidence

- Review `git diff` and the actual test output.
- Check a task created before the migration defaults to normal.
- Create a high-priority task, edit it, and refresh the page.
- Check an invalid priority cannot reach the database through the API.
- Confirm status and search continue to work.

If a failure occurs, ask the agent to explain the failure before making the smallest justified fix. Do not invent a failure if the tests pass.

## 5. Show an OpenCode capability

> @explore Trace every caller of validateTask and identify compatibility risks in the priority change. Do not edit files.

Optionally show a second configured model reviewing the same diff. For the centralized-server part of the talk, run the repo on the OpenCode server host and attach a second client. Both clients see the server workspace; attaching does not upload your local files.

## Completion criteria

All baseline tests and new tests pass. Existing SQLite files migrate without losing tasks. The UI can create/edit/filter priorities. The API rejects unsupported values. The README and AGENTS.md describe any changed contract or commands.
