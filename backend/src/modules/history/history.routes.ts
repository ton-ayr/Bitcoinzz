import { Router, type RequestHandler } from 'express';
import type { HistoryController } from './history.controller.js';

export function historyRoutes(
  controller: HistoryController,
  requireAuth: RequestHandler[],
): Router {
  const router = Router();
  router.get('/history', ...requireAuth, controller.last24h);
  return router;
}
