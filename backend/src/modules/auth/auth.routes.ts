import { Router } from 'express';
import { createLoginRateLimiter, createRegisterRateLimiter } from '../../shared/http/rate-limit.js';
import { validate } from '../../shared/http/validate.js';
import type { AuthController } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export function authRoutes(controller: AuthController): Router {
  const router = Router();

  router.post(
    '/account',
    createRegisterRateLimiter(),
    validate({ body: registerSchema }),
    controller.register,
  );

  // O limitador vem depois do `validate` porque usa o e-mail já normalizado como chave.
  router.post(
    '/login',
    validate({ body: loginSchema }),
    createLoginRateLimiter(),
    controller.login,
  );

  return router;
}
