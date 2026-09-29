import { createApi } from './api.js';
import { store } from './store.server.js';
export const handleApi = createApi(store);
