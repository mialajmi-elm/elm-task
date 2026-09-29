import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTask } from '../src/validation.js';

test('normalizes a valid title without losing Unicode', () => {
  assert.deepEqual(validateTask({ title: '  مراجعة الاختبارات  ' }), {
    title: 'مراجعة الاختبارات',
  });
});
for (const [name, value] of [
  ['missing', {}],
  ['empty', { title: '' }],
  ['whitespace', { title: ' \t\n ' }],
  ['wrong type', { title: 7 }],
  ['long', { title: 'x'.repeat(121) }],
  ['array', []],
  ['null', null],
]) {
  test(`rejects ${name} task input`, () =>
    assert.throws(() => validateTask(value), { status: 400 }));
}
test('accepts exactly 120 characters', () =>
  assert.equal(validateTask({ title: 'x'.repeat(120) }).title.length, 120));
test('partial updates preserve omitted fields', () =>
  assert.deepEqual(validateTask({ completed: false }, { partial: true }), {
    completed: false,
  }));
test('rejects empty patches, unknown fields, and nonboolean status', () => {
  for (const input of [{}, { surprise: 'yes' }, { completed: 'false' }])
    assert.throws(() => validateTask(input, { partial: true }), {
      status: 400,
    });
});
