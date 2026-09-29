import { fileURLToPath } from 'node:url';
import { openStore } from '../src/database.js';
const store = openStore(
  process.env.DB_PATH ||
    fileURLToPath(new URL('../data/tasks.sqlite', import.meta.url)),
);
try {
  if (store.list().length)
    console.log('Database already has tasks. Nothing changed.');
  else {
    [
      { title: 'Map the repository and its test suite', completed: true },
      { title: 'Explore the API with OpenCode' },
      { title: 'Plan a small feature together' },
      { title: 'Review the diff and run the tests' },
    ].forEach((item) => store.create(item));
    console.log('Created four demo tasks.');
  }
} finally {
  store.close();
}
