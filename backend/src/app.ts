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
}

/**
 * Monta a aplicação Express sem iniciar o servidor.
 * Separar `createApp` do `server.ts` permite testar as rotas com Supertest.
 */
export function createApp({ container, logger, corsOrigins }: AppOptions): Express {
  const app = express();

  // Atrás do proxy do Render: necessário para o IP real chegar ao rate limit.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: corsOrigins }));
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const requestId = req.headers['x-request-id']?.toString() ?? randomUUID();
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
