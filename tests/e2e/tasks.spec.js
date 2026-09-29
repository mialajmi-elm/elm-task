import { test, expect } from '@playwright/test';
test.beforeEach(async ({ request, page }) => {
  const { tasks } = await (await request.get('/api/tasks')).json();
  for (const task of tasks) await request.delete(`/api/tasks/${task.id}`);
  await page.goto('/');
  await expect(page.getByText('Loading your tasks…')).toBeHidden();
});
async function add(page, title) {
  await page.getByLabel('New task title').fill(title);
  await page.getByRole('button', { name: '+ Add task', exact: true }).click();
  await expect(
    page.locator('.task-title').filter({ hasText: title }),
  ).toBeVisible();
}
test('create, complete, filter, edit, reload, and delete a task', async ({
  page,
}) => {
  await add(page, 'Plan the demo');
  await page.getByRole('checkbox', { name: 'Complete Plan the demo' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Complete Plan the demo' }),
  ).toBeChecked();
  await expect(page.locator('#done')).toHaveText('1');
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(page.locator('#task-list li')).toHaveCount(0);
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await page
    .getByRole('button', { name: 'Edit Plan the demo', exact: true })
    .click();
  await page
    .getByLabel('Task title', { exact: true })
    .fill('Rehearse the demo');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await expect(page.locator('.task-title')).toHaveText('Rehearse the demo');
  await expect(page.getByRole('checkbox')).toBeChecked();
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Delete Rehearse the demo', exact: true })
    .click();
  await expect(page.locator('#task-list li')).toHaveCount(0);
  await expect(page.locator('#total')).toHaveText('0');
});
test('search, empty state, and counts stay consistent', async ({ page }) => {
  await add(page, 'Review the API');
  await add(page, 'Write tests');
  await page.getByLabel('Search tasks').fill('API');
  await expect(page.locator('#task-list li')).toHaveCount(1);
  await expect(page.locator('#total')).toHaveText('2');
  await page.getByLabel('Search tasks').fill('no match');
  await expect(
    page.getByText('No tasks match this view. Try another filter or search.'),
  ).toBeVisible();
});
test('validation error preserves input and allows recovery', async ({
  page,
}) => {
  await page.getByLabel('New task title').fill('   ');
  await page.getByRole('button', { name: '+ Add task', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('A task title is required.');
  await expect(page.locator('#task-list li')).toHaveCount(0);
  await add(page, 'A valid task');
  await expect(page.locator('#error')).toBeHidden();
});
test('failed save shows an error and keeps the draft', async ({ page }) => {
  await page.route('**/api/tasks', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"error":"Service unavailable."}',
        })
      : route.continue(),
  );
  await page.getByLabel('New task title').fill('Keep this draft');
  await page.getByRole('button', { name: '+ Add task', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Service unavailable.');
  await expect(page.getByLabel('New task title')).toHaveValue(
    'Keep this draft',
  );
  await expect(page.locator('#task-list li')).toHaveCount(0);
});
test('task titles render as text rather than HTML', async ({ page }) => {
  await add(page, '<img src=x onerror=alert(1)>');
  await expect(page.locator('#task-list img')).toHaveCount(0);
});
test('mobile layout fits and supports creating a task', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await add(page, 'Mobile task');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Edit Mobile task' }),
  ).toBeVisible();
});

test('production server routes enforce the API contract and keep private files private', async ({
  request,
}) => {
  const created = await request.post('/api/tasks', {
    data: { title: '  API smoke  ' },
  });
  expect(created.status()).toBe(201);
  const { task } = await created.json();
  expect(task.title).toBe('API smoke');
  expect((await request.get(`/api/tasks/${task.id}`)).status()).toBe(200);
  expect(
    (
      await request.patch(`/api/tasks/${task.id}`, {
        data: { completed: 'yes' },
      })
    ).status(),
  ).toBe(400);
  expect((await request.put('/api/tasks', { data: {} })).status()).toBe(405);
  expect(
    (
      await request.post('/api/tasks', {
        data: { title: 'blocked' },
        headers: { Origin: 'https://other.example' },
      })
    ).status(),
  ).toBe(403);
  for (const path of [
    '/data/tasks.sqlite',
    '/src/database.js',
    '/package.json',
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  const html = await (await request.get('/')).text();
  expect(html).toContain('A little more focus.');
});

test('failed completion keeps the saved task status', async ({ page }) => {
  await add(page, 'Keep active');
  await page.route('**/api/tasks/*', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"error":"Update failed."}',
        })
      : route.continue(),
  );
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('alert')).toHaveText('Update failed.');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await expect(page.locator('#active')).toHaveText('1');
});
