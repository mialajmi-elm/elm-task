import { HttpError, validateTask } from '../validation.js';
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const json = (data, status = 200, extra = {}) =>
  Response.json(data, { status, headers: { ...headers, ...extra } });
async function body(request) {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    throw new HttpError(415, 'Send Content-Type: application/json.');
  const reader = request.body?.getReader();
  let size = 0;
  const chunks = [];
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 16384) {
          await reader.cancel();
          throw new HttpError(413, 'Request body is too large.');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
export function createApi(store, { logger = console } = {}) {
  return async (request) => {
    try {
      const url = new URL(request.url),
        method = request.method;
      const origin = request.headers.get('origin');
      if (!['GET', 'HEAD'].includes(method) && origin && origin !== url.origin)
        throw new HttpError(403, 'Cross-origin writes are not allowed.');
      if (url.pathname === '/api/health' && method === 'GET')
        return json({ status: 'ok' });
      if (url.pathname === '/api/tasks') {
        if (method === 'GET') return json({ tasks: store.list() });
        if (method === 'POST') {
          const task = store.create(validateTask(await body(request)));
          return json({ task }, 201, { Location: `/api/tasks/${task.id}` });
        }
        throw new HttpError(405, 'Method not allowed.');
      }
      const match = /^\/api\/tasks\/([1-9]\d*)$/.exec(url.pathname);
      if (!match) throw new HttpError(404, 'Not found.');
      const id = Number(match[1]);
      if (!Number.isSafeInteger(id))
        throw new HttpError(400, 'Invalid task ID.');
      if (!['GET', 'PATCH', 'DELETE'].includes(method))
        throw new HttpError(405, 'Method not allowed.');
      if (!store.get(id)) throw new HttpError(404, 'Task not found.');
      if (method === 'GET') return json({ task: store.get(id) });
      if (method === 'PATCH')
        return json({
          task: store.update(
            id,
            validateTask(await body(request), { partial: true }),
          ),
        });
      store.delete(id);
      return new Response(null, { status: 204, headers });
    } catch (error) {
      if (!(error instanceof HttpError)) logger.error(error);
      return json(
        {
          error:
            error instanceof HttpError
              ? error.message
              : 'Something went wrong.',
        },
        error instanceof HttpError ? error.status : 500,
      );
    }
  };
}
