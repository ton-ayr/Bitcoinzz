import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { BusinessRuleError } from '../../src/shared/errors/app-error.js';
import { createErrorHandler } from '../../src/shared/http/error-handler.js';
import { validate } from '../../src/shared/http/validate.js';
import { createTestApp, silentLogger } from '../helpers/test-app.js';

describe('App', () => {
  describe('GET /health', () => {
    it('200 quando o banco está conectado', async () => {
      const response = await request(createTestApp()).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', database: 'up' });
    });

    it('503 quando o banco está fora', async () => {
      const response = await request(createTestApp({ isDatabaseConnected: () => false })).get(
        '/health',
      );
      expect(response.status).toBe(503);
      expect(response.body).toEqual({ status: 'degraded', database: 'down' });
    });

    it('devolve um x-request-id e headers de segurança', async () => {
      const response = await request(createTestApp()).get('/health');
      expect(response.headers['x-request-id']).toBeTruthy();
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  it('rota inexistente → 404 no formato padrão', async () => {
    const response = await request(createTestApp()).get('/nao-existe');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Rota não encontrada: GET /nao-existe',
    });
  });

  it('JSON malformado → 400', async () => {
    const response = await request(createTestApp())
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"amount": ');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('JSON inválido no corpo da requisição');
  });
});

describe('validate + error-handler', () => {
  // App mínimo só para exercitar os middlewares compartilhados.
  const app = express();
  app.use(express.json());
  app.post('/echo', validate({ body: z.object({ amount: z.number().positive() }) }), (req, res) => {
    res.json(req.body);
  });
  app.get(
    '/query',
    validate({ query: z.object({ page: z.coerce.number().int() }) }),
    (req, res) => {
      res.json(req.query);
    },
  );
  app.get('/business', () => {
    throw new BusinessRuleError('Saldo insuficiente');
  });
  app.get('/boom', async () => {
    throw new Error('falha inesperada com detalhe interno');
  });
  app.use(createErrorHandler(silentLogger));

  it('body válido passa para o handler já convertido', async () => {
    const response = await request(app).post('/echo').send({ amount: 10, extra: 'ignorado' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ amount: 10 });
  });

  it('body inválido → 400 com details por campo', async () => {
    const response = await request(app).post('/echo').send({ amount: -5 });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Dados inválidos');
    expect(response.body.details[0].field).toBe('amount');
    expect(response.body.details[0].message).toMatch(/esperava/i); // locale pt do Zod (fallback)
  });

  it('query é validada e convertida', async () => {
    const response = await request(app).get('/query?page=2');
    expect(response.body).toEqual({ page: 2 });
  });

  it('AppError vira o status correspondente', async () => {
    const response = await request(app).get('/business');
    expect(response.status).toBe(422);
    expect(response.body).toEqual({ statusCode: 422, message: 'Saldo insuficiente' });
  });

  it('erro inesperado em handler async → 500 sem vazar detalhes', async () => {
    const response = await request(app).get('/boom');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ statusCode: 500, message: 'Erro interno do servidor' });
  });
});
