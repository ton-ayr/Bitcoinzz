import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_MESSAGE } from '../../src/modules/quotes/mercado-bitcoin.client.js';
import { ServiceUnavailableError } from '../../src/shared/errors/app-error.js';
import { signUpAndLogin } from '../helpers/auth.js';
import { useTestDatabase } from '../helpers/database.js';
import { FakeQuoteProvider } from '../helpers/fakes.js';
import { createTestApp } from '../helpers/test-app.js';

useTestDatabase();

describe('GET /btc/price', () => {
  it('401 sem token (todas as rotas, exceto cadastro e login, exigem autenticação)', async () => {
    const response = await request(createTestApp()).get('/btc/price');
    expect(response.status).toBe(401);
  });

  it('200 com a cotação de compra e venda em reais', async () => {
    const app = createTestApp({ quoteProvider: new FakeQuoteProvider(42725300, 42725400) });
    const auth = await signUpAndLogin(app);

    const response = await request(app).get('/btc/price').set('Authorization', auth);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      buy: 427253,
      sell: 427254,
      updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  it('503 com mensagem clara quando o Mercado Bitcoin está fora', async () => {
    const provider = new FakeQuoteProvider();
    provider.failure = new ServiceUnavailableError(UNAVAILABLE_MESSAGE);
    const app = createTestApp({ quoteProvider: provider });
    const auth = await signUpAndLogin(app);

    const response = await request(app).get('/btc/price').set('Authorization', auth);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ statusCode: 503, message: UNAVAILABLE_MESSAGE });
  });
});
