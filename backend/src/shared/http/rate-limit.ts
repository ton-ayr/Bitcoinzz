import type { Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../errors/app-error.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/**
 * Login: no máximo 10 senhas erradas POR E-MAIL a cada 15 min (acertos não contam).
 * A chave é o e-mail, e não o IP, porque pelo BFF do front todas as requisições
 * chegam com o IP do servidor da Vercel. Ver "Decisões-chave" em docs/architecture.md.
 */
export function createLoginRateLimiter() {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req: Request) => `login:${String(req.body?.email)}`,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new TooManyRequestsError(
          'Muitas tentativas de login para este e-mail. Tente novamente em alguns minutos.',
        ),
      );
    },
  });
}

/**
 * Rotas logadas: 300 requisições por usuário a cada 15 min.
 * Folga suficiente para o dashboard, que atualiza a cotação a cada 15 s (~135 req / 15 min).
 * Precisa vir DEPOIS do `authenticate`, que preenche `req.userId`.
 */
export function createUserRateLimiter() {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 300,
    keyGenerator: (req: Request) => `user:${String(req.userId)}`,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError('Muitas requisições. Aguarde alguns minutos.'));
    },
  });
}

/** Cadastro: proteção contra criação de contas em massa (30 por hora por IP). */
export function createRegisterRateLimiter() {
  return rateLimit({
    windowMs: ONE_HOUR,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new TooManyRequestsError('Muitos cadastros em pouco tempo. Tente novamente mais tarde.'),
      );
    },
  });
}
