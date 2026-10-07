import { Router } from 'express';
import type { Container } from './container.js';
import { accountRoutes } from './modules/account/account.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { docsRoutes } from './modules/docs/docs.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { historyRoutes } from './modules/history/history.routes.js';
import { investmentRoutes } from './modules/investments/investment.routes.js';
import { quoteRoutes } from './modules/quotes/quote.routes.js';
import { transactionRoutes } from './modules/transactions/transaction.routes.js';

/** Junta os routers de todos os módulos. */
export function createRoutes(container: Container): Router {
  const router = Router();
  router.use(docsRoutes());
  router.use(healthRoutes(container.healthController));
  router.use(authRoutes(container.authController));
  router.use(accountRoutes(container.accountController, container.requireAuth));
  router.use(quoteRoutes(container.quoteController, container.requireAuth));
  router.use(investmentRoutes(container.investmentController, container.requireAuth));
  router.use(transactionRoutes(container.transactionController, container.requireAuth));
  router.use(historyRoutes(container.historyController, container.requireAuth));
  return router;
}
