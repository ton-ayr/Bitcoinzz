import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { loadOpenApiDocument } from '../../src/modules/docs/docs.routes.js';
import { useTestDatabase } from '../helpers/database.js';
import { createTestApp } from '../helpers/test-app.js';

useTestDatabase();

type Method = 'get' | 'post';
interface Operation {
  security?: unknown[];
}

const document = loadOpenApiDocument() as {
  paths: Record<string, Partial<Record<Method, Operation>>>;
};

/** Todas as combinações rota + método documentadas, com a indicação de "exige login". */
const documentedOperations = Object.entries(document.paths).flatMap(([path, operations]) =>
  (Object.keys(operations) as Method[]).map((method) => ({
    method,
    path,
    // `security: []` na operação = rota pública; sem isso, vale o bearerAuth global.
    requiresAuth: !(operations[method]?.security?.length === 0),
  })),
);

describe('documentação (Swagger)', () => {
  it('a especificação OpenAPI é válida', async () => {
    await expect(SwaggerParser.validate(structuredClone(document) as never)).resolves.toBeDefined();
  });

  it('documenta as 14 operações da API', () => {
    expect(
      documentedOperations.map(({ method, path }) => `${method.toUpperCase()} ${path}`),
    ).toEqual([
      'GET /',
      'GET /health',
      'POST /account',
      'GET /account',
      'POST /login',
      'POST /account/deposit',
      'GET /account/balance',
      'GET /btc/price',
      'GET /btc',
      'POST /btc/purchase',
      'POST /btc/sell',
      'GET /extract',
      'GET /volume',
      'GET /history',
    ]);
  });

  it.each(documentedOperations)(
    'contrato: $method $path existe e a exigência de login confere com a doc',
    async ({ method, path, requiresAuth }) => {
      const response = await request(createTestApp())[method](path).send({});

      expect(response.status).not.toBe(404);
      if (requiresAuth) {
        expect(response.status).toBe(401);
      } else {
        expect(response.status).not.toBe(401);
      }
    },
  );

  it('GET / devolve os links úteis', async () => {
    const response = await request(createTestApp()).get('/');
    expect(response.body).toEqual({ name: 'Bitcoinzz API', docs: '/docs', health: '/health' });
  });

  it('GET /docs/ serve a interface do Swagger e /docs/openapi.json a especificação', async () => {
    const app = createTestApp();

    const ui = await request(app).get('/docs/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');

    const spec = await request(app).get('/docs/openapi.json');
    expect(spec.body.info.title).toBe('Bitcoinzz API');
  });
});
