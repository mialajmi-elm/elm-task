import { createFileRoute } from '@tanstack/react-router';
import { handleApi } from '../server/handler.server.js';
const handler = ({ request }: { request: Request }) => handleApi(request);
export const Route = createFileRoute('/api/tasks')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PATCH: handler,
      DELETE: handler,
      PUT: handler,
    },
  },
});
