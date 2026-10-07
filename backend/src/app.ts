import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { z } from 'zod';
import type { Logger } from './config/logger.js';
import type { Container } from './container.js';
import { createRoutes } from './routes.js';
import { createErrorHandler } from './shared/http/error-handler.js';
import { notFoundHandler } from './shared/http/not-found.js';

// Mensagens padrão do Zod em português.
z.config(z.locales.pt());

export interface AppOptions {
  container: Container;
  logger: Logger;
  corsOrigins: string[];
  /** true atrás de um proxy confiável (Render): o IP do cliente vem do X-Forwarded-For. */
  trustProxy?: boolean;
}

// Só aceitamos um x-request-id "limpo" vindo de fora; qualquer outra coisa é substituída.
// Evita que um texto arbitrário (ex.: com quebras de linha) seja injetado nos logs.
const SAFE_REQUEST_ID = /^[\w-]{1,64}$/;

/**
 * Monta a aplicação Express sem iniciar o servidor.
 * Separar `createApp` do `server.ts` permite testar as rotas com Supertest.
 */
export function createApp({
  container,
  logger,
  corsOrigins,
  trustProxy = false,
}: AppOptions): Express {
  const app = express();

  // Atrás do proxy do Render, o IP real do cliente chega no X-Forwarded-For.
  // Sem proxy (desenvolvimento), confiar nesse header permitiria falsificar o IP.
  app.set('trust proxy', trustProxy ? 1 : false);

  app.use(helmet());
  app.use(cors({ origin: corsOrigins }));
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id']?.toString();
        const requestId = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
        res.setHeader('x-request-id', requestId);
        return requestId;
      },
      // Loga só o essencial de cada requisição (sem headers, cookies ou corpo).
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json({ limit: '10kb' }));

  app.use(createRoutes(container));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
