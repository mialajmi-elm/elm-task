import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleTasks, taskSummary } from '../src/view.js';
const tasks = [
  { id: 1, title: 'Review API', completed: false },
  { id: 2, title: 'Run tests', completed: true },
];
test('filters active and completed tasks', () => {
  assert.deepEqual(
    visibleTasks(tasks, 'active').map((x) => x.id),
    [1],
  );
  assert.deepEqual(
    visibleTasks(tasks, 'completed').map((x) => x.id),
    [2],
  );
});
test('combines status and case-insensitive trimmed search without mutating input', () => {
  assert.deepEqual(
    visibleTasks(tasks, 'all', ' API ').map((x) => x.id),
    [1],
  );
  assert.deepEqual(visibleTasks(tasks, 'completed', 'API'), []);
  assert.equal(tasks.length, 2);
});
test('summary uses the whole dataset and handles no tasks', () => {
  assert.deepEqual(taskSummary(tasks), { total: 2, active: 1, completed: 1 });
  assert.deepEqual(taskSummary([]), { total: 0, active: 0, completed: 0 });
});
