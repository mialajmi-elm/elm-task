import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { createApi } from '../src/server/api.js';
import { openStore } from '../src/database.js';
let store, api;
const base = 'http://localhost';
const fetch = (url, options) => api(new Request(url, options));
beforeEach(() => {
  store = openStore();
  api = createApi(store, { logger: { error() {} } });
});
afterEach(() => store.close());
const call = (path = '/api/tasks', method = 'GET', data) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });

test('full create/read/update/delete lifecycle', async () => {
  const create = await call('/api/tasks', 'POST', { title: '  Demo task  ' });
  assert.equal(create.status, 201);
  const { task } = await create.json();
  assert.equal(task.title, 'Demo task');
  assert.equal(task.completed, false);
  assert.equal(create.headers.get('location'), `/api/tasks/${task.id}`);
  assert.equal((await (await call()).json()).tasks.length, 1);
  assert.equal(
    (await (await call(`/api/tasks/${task.id}`)).json()).task.id,
    task.id,
  );
  const update = await call(`/api/tasks/${task.id}`, 'PATCH', {
    completed: true,
  });
  assert.equal((await update.json()).task.completed, true);
  const rename = await call(`/api/tasks/${task.id}`, 'PATCH', {
    title: 'Renamed',
  });
  assert.equal((await rename.json()).task.completed, true);
  assert.equal((await call(`/api/tasks/${task.id}`, 'DELETE')).status, 204);
  assert.equal((await call(`/api/tasks/${task.id}`)).status, 404);
});
test('invalid create and edit cannot corrupt existing tasks', async () => {
  for (const title of ['', '   ', 99, 'x'.repeat(121)])
    assert.equal((await call('/api/tasks', 'POST', { title })).status, 400);
  const { task } = await (
    await call('/api/tasks', 'POST', { title: 'Keep me' })
  ).json();
  assert.equal(
    (await call(`/api/tasks/${task.id}`, 'PATCH', { title: '  ' })).status,
    400,
  );
  assert.equal(
    (await call(`/api/tasks/${task.id}`, 'PATCH', { completed: 'false' }))
      .status,
    400,
  );
  assert.equal(store.get(task.id).title, 'Keep me');
});
test('missing records return 404 and unsupported methods return 405', async () => {
  for (const method of ['GET', 'PATCH', 'DELETE'])
    assert.equal(
      (
        await call(
          '/api/tasks/999',
          method,
          method === 'PATCH' ? { completed: true } : undefined,
        )
      ).status,
      404,
    );
  assert.equal((await call('/api/tasks', 'PUT', {})).status, 405);
});
test('malformed JSON and wrong content types have clear errors', async () => {
  const malformed = await fetch(base + '/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{broken',
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'Invalid JSON.' });
  assert.equal(
    (await fetch(base + '/api/tasks', { method: 'POST', body: '{}' })).status,
    415,
  );
});
test('oversized payloads are rejected', async () => {
  const response = await call('/api/tasks', 'POST', {
    title: 'x'.repeat(17000),
  });
  assert.equal(response.status, 413);
});
test('cross-origin writes are rejected', async () => {
  const response = await fetch(base + '/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://other.example',
    },
    body: '{"title":"no"}',
  });
  assert.equal(response.status, 403);
  assert.equal(store.list().length, 0);
});
test('health endpoint responds and unknown API paths return 404', async () => {
  assert.deepEqual(await (await fetch(base + '/api/health')).json(), {
    status: 'ok',
  });
  assert.equal((await fetch(base + '/api/unknown')).status, 404);
});
test('unexpected database errors do not expose internal details', async () => {
  store.list = () => {
    throw new Error('private database path');
  };
  const response = await call();
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Something went wrong.' });
});
