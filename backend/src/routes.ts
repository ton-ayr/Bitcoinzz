import { Router } from 'express';
import type { Container } from './container.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';

/** Junta os routers de todos os módulos. */
export function createRoutes(container: Container): Router {
  const router = Router();
  router.use(healthRoutes(container.healthController));
  router.use(authRoutes(container.authController));
  return router;
}
