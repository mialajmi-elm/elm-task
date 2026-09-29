import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const task = (row) =>
  row ? { ...row, completed: Boolean(row.completed) } : null;

export function openStore(filename = ':memory:') {
  if (filename !== ':memory:')
    mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
      completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);
  return {
    list() {
      return db.prepare('SELECT * FROM tasks ORDER BY id DESC').all().map(task);
    },
    get(id) {
      return task(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
    },
    create({ title, completed = false }) {
      const result = db
        .prepare('INSERT INTO tasks(title, completed) VALUES (?, ?)')
        .run(title, Number(completed));
      return this.get(Number(result.lastInsertRowid));
    },
    update(id, values) {
      const current = this.get(id);
      if (!current) return null;
      db.prepare('UPDATE tasks SET title = ?, completed = ? WHERE id = ?').run(
        values.title ?? current.title,
        Number(values.completed ?? current.completed),
        id,
      );
      return this.get(id);
    },
    delete(id) {
      return db.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0;
    },
    close() {
      db.close();
    },
  };
}
