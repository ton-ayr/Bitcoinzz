import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { Logger } from '../../config/logger.js';
import { AppError, type ErrorDetail } from '../errors/app-error.js';

interface ErrorBody {
  statusCode: number;
  message: string;
  details?: ErrorDetail[];
}

/** Erros gerados pelo `express.json()` (body-parser) trazem um `type`. */
function isBodyParserError(error: unknown): error is { type: string; status: number } {
  return typeof error === 'object' && error !== null && 'type' in error && 'status' in error;
}

function toErrorBody(error: unknown): ErrorBody | null {
  if (error instanceof AppError) {
    return { statusCode: error.statusCode, message: error.message, details: error.details };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Dados inválidos',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  if (isBodyParserError(error)) {
    if (error.type === 'entity.parse.failed') {
      return { statusCode: 400, message: 'JSON inválido no corpo da requisição' };
    }
    if (error.type === 'entity.too.large') {
      return { statusCode: 413, message: 'Corpo da requisição muito grande' };
    }
    // Outros erros 4xx do body-parser (ex.: charset ou content-encoding não suportado).
    if (error.status >= 400 && error.status < 500) {
      return { statusCode: error.status, message: 'Requisição inválida' };
    }
  }

  return null;
}

/**
 * Último middleware da aplicação: transforma qualquer erro em uma resposta
 * no formato padrão `{ statusCode, message, details? }`.
 * Erros desconhecidos viram 500 e são logados com a stack (sem vazar detalhes ao cliente).
 */
export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error, _req, res, _next) => {
    const body = toErrorBody(error);

    if (body) {
      // Erros 5xx "esperados" (ex.: Mercado Bitcoin fora do ar) também precisam deixar rastro no log.
      if (body.statusCode >= 500) {
        logger.warn({ err: error }, body.message);
      }
      res.status(body.statusCode).json(body);
      return;
    }

    logger.error({ err: error }, 'Erro inesperado');
    res.status(500).json({ statusCode: 500, message: 'Erro interno do servidor' });
  };
}
