import type { RequestHandler } from 'express';
import { NotFoundError } from '../errors/app-error.js';

/** Registrado depois de todas as rotas: qualquer URL que chegue aqui não existe. */
export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`Rota não encontrada: ${req.method} ${req.path}`);
};
