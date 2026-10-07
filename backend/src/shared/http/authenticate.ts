import type { Request, RequestHandler } from 'express';
import type { TokenService } from '../../modules/auth/token-service.js';
import { UnauthorizedError } from '../errors/app-error.js';

/**
 * Exige o header `Authorization: Bearer <token>`.
 * Se o token for válido, guarda o id do usuário em `req.userId` para os controllers.
 */
export function createAuthenticate(tokens: Pick<TokenService, 'verify'>): RequestHandler {
  return (req, _res, next) => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Token de acesso não informado');
    }

    req.userId = tokens.verify(token);
    next();
  };
}

/** Para controllers de rotas protegidas: devolve o id do usuário autenticado. */
export function getUserId(req: Pick<Request, 'userId'>): string {
  if (!req.userId) {
    throw new UnauthorizedError();
  }
  return req.userId;
}
