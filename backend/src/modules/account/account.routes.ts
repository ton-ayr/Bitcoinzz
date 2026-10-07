import { Router, type RequestHandler } from 'express';
import { validate } from '../../shared/http/validate.js';
import type { AccountController } from './account.controller.js';
import { depositSchema } from './account.schemas.js';

/** `requireAuth` = autenticação + limite por usuário (montado no container). */
export function accountRoutes(
  controller: AccountController,
  requireAuth: RequestHandler[],
): Router {
  const router = Router();

  router.get('/account', ...requireAuth, controller.profile);
  router.get('/account/balance', ...requireAuth, controller.balance);
  router.post(
    '/account/deposit',
    ...requireAuth,
    validate({ body: depositSchema }),
    controller.deposit,
  );

  return router;
}
