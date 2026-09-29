import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/database.js';

test('tasks persist across reopening the SQLite file', () => {
  const directory = mkdtempSync(join(tmpdir(), 'elm-tasks-'));
  let store;
  try {
    const filename = join(directory, 'test.sqlite');
    store = openStore(filename);
    const saved = store.create({ title: "Don't lose this task" });
    store.close();
    store = openStore(filename);
    assert.equal(store.get(saved.id).title, "Don't lose this task");
    assert.equal(store.get(saved.id).completed, false);
  } finally {
    store?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
test('partial updates, newest-first order, and deletion', (t) => {
  const store = openStore();
  t.after(() => store.close());
  const first = store.create({ title: 'First' });
  const second = store.create({ title: 'Second' });
  assert.deepEqual(
    store.list().map((x) => x.id),
    [second.id, first.id],
  );
  assert.equal(store.update(first.id, { completed: true }).title, 'First');
  assert.equal(store.update(first.id, { completed: false }).completed, false);
  assert.equal(store.update(999, { title: 'Missing' }), null);
  assert.equal(store.delete(first.id), true);
  assert.equal(store.delete(first.id), false);
});
test('SQL-like titles remain data', (t) => {
  const store = openStore();
  t.after(() => store.close());
  const title = "'); DROP TABLE tasks; --";
  assert.equal(store.create({ title }).title, title);
  assert.equal(store.list().length, 1);
});
