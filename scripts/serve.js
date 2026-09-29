import { serve } from '@hono/node-server';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import app from '../dist/server/server.js';
const root = resolve('dist/client');
const types = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
serve(
  {
    hostname: '127.0.0.1',
    port: Number(process.env.PORT || 3000),
    fetch: async (request) => {
      const url = new URL(request.url);
      if (
        ['GET', 'HEAD'].includes(request.method) &&
        url.pathname.startsWith('/assets/')
      ) {
        const file = resolve(root, '.' + decodeURIComponent(url.pathname));
        if (file.startsWith(root + sep)) {
          try {
            const data = await readFile(file);
            return new Response(request.method === 'HEAD' ? null : data, {
              headers: {
                'Content-Type':
                  types[extname(file)] || 'application/octet-stream',
              },
            });
          } catch {}
        }
      }
      return app.fetch(request);
    },
  },
  (info) => console.log(`elm-tasks running at http://127.0.0.1:${info.port}`),
);
