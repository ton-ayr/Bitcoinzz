import { Router, type RequestHandler } from 'express';
import { validate } from '../../shared/http/validate.js';
import type { InvestmentController } from './investment.controller.js';
import { purchaseSchema, sellSchema } from './investment.schemas.js';

export function investmentRoutes(
  controller: InvestmentController,
  requireAuth: RequestHandler[],
): Router {
  const router = Router();

  // GET /btc = posição dos investimentos (mesma rota da coleção Postman do desafio).
  router.get('/btc', ...requireAuth, controller.position);
  router.post(
    '/btc/purchase',
    ...requireAuth,
    validate({ body: purchaseSchema }),
    controller.purchase,
  );
  router.post('/btc/sell', ...requireAuth, validate({ body: sellSchema }), controller.sell);

  return router;
}
