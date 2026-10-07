import { Router, type RequestHandler } from 'express';
import type { QuoteController } from './quote.controller.js';

export function quoteRoutes(controller: QuoteController, requireAuth: RequestHandler[]): Router {
  const router = Router();
  router.get('/btc/price', ...requireAuth, controller.price);
  return router;
}
