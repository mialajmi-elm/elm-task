export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function validateTask(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Expected a JSON object.');
  }
  const keys = Object.keys(input);
  if (keys.some((key) => !['title', 'completed'].includes(key))) {
    throw new HttpError(400, 'Only title and completed are supported.');
  }
  if (partial && keys.length === 0)
    throw new HttpError(400, 'Provide a field to update.');
  const result = {};
  if (!partial || Object.hasOwn(input, 'title')) {
    if (typeof input.title !== 'string' || !input.title.trim()) {
      throw new HttpError(400, 'A task title is required.');
    }
    const title = input.title.trim();
    if (title.length > 120)
      throw new HttpError(400, 'Keep the title to 120 characters or fewer.');
    result.title = title;
  }
  if (Object.hasOwn(input, 'completed')) {
    if (typeof input.completed !== 'boolean')
      throw new HttpError(400, 'Completed must be a boolean.');
    result.completed = input.completed;
  }
  return result;
}
