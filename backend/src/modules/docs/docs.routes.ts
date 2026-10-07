import { readFileSync } from 'node:fs';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

// backend/docs/openapi.yaml. O caminho relativo funciona tanto em src/ (dev) quanto em dist/ (build).
const SPEC_FILE = new URL('../../../docs/openapi.yaml', import.meta.url);

/** Especificação OpenAPI escrita à mão (design-first), lida uma vez na subida. */
export function loadOpenApiDocument(): Record<string, unknown> {
  return parse(readFileSync(SPEC_FILE, 'utf8')) as Record<string, unknown>;
}

/** `GET /` (links úteis), `GET /docs` (Swagger UI) e `GET /docs/openapi.json` (spec crua). */
export function docsRoutes(): Router {
  const document = loadOpenApiDocument();
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({ name: 'Bitcoinzz API', docs: '/docs', health: '/health' });
  });
  router.get('/docs/openapi.json', (_req, res) => {
    res.json(document);
  });
  router.use('/docs', swaggerUi.serve);
  router.get(
    '/docs',
    swaggerUi.setup(document, {
      customSiteTitle: 'Bitcoinzz API',
      // Mantém o token do "Authorize" ao recarregar a página.
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  return router;
}
