import { resolve } from 'node:path';
import { openStore } from '../database.js';
// One connection per server process, including development hot reloads.
const key = Symbol.for('elm-tasks.store');
export const store = (globalThis[key] ??= openStore(
  process.env.DB_PATH || resolve('data/tasks.sqlite'),
));
