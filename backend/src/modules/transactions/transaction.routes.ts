import { Router, type RequestHandler } from 'express';
import { validate } from '../../shared/http/validate.js';
import { statementQuerySchema } from './statement.schemas.js';
import type { TransactionController } from './transaction.controller.js';

export function transactionRoutes(
  controller: TransactionController,
  requireAuth: RequestHandler[],
): Router {
  const router = Router();
  router.get(
    '/extract',
    ...requireAuth,
    validate({ query: statementQuerySchema }),
    controller.statement,
  );
  router.get('/volume', ...requireAuth, controller.volume);
  return router;
}
