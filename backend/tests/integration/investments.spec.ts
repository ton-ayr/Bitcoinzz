import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { InvestmentModel } from '../../src/modules/investments/investment.model.js';
import { MongooseInvestmentRepository } from '../../src/modules/investments/investment.repository.js';
import { TransactionModel } from '../../src/modules/transactions/transaction.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { fulano, signUpAndLogin } from '../helpers/auth.js';
import { useTestDatabase } from '../helpers/database.js';
import { FakeQuoteProvider } from '../helpers/fakes.js';
import { createTestApp } from '../helpers/test-app.js';

useTestDatabase();

// Cotação fixa: compra R$ 427.253,00 / venda R$ 427.254,00.
const quote = () => new FakeQuoteProvider(42_725_300, 42_725_400);

async function deposit(app: Express, auth: string, amount: number) {
  await request(app).post('/account/deposit').set('Authorization', auth).send({ amount });
}

describe('rotas de investimento', () => {
  let app: Express;
  let auth: string;

  beforeEach(async () => {
    app = createTestApp({ quoteProvider: quote() });
    auth = await signUpAndLogin(app);
  });

  it.each([
    ['get', '/btc'],
    ['post', '/btc/purchase'],
  ] as const)('401 sem token: %s %s', async (method, path) => {
    expect((await request(app)[method](path)).status).toBe(401);
  });

  it('compra (exemplo da coleção Postman: amount 25) e aparece na posição', async () => {
    await deposit(app, auth, 100);

    const purchase = await request(app)
      .post('/btc/purchase')
      .set('Authorization', auth)
      .send({ amount: 25 });

    // R$ 25 / R$ 427.254 = 0,00005851... BTC → 5.851 sats
    expect(purchase.status).toBe(201);
    expect(purchase.body).toEqual({
      amount: 25,
      btcAmount: 0.00005851,
      btcPrice: 427254,
      balance: 75,
    });

    const position = await request(app).get('/btc').set('Authorization', auth);
    expect(position.status).toBe(200);
    expect(position.body.investments).toEqual([
      {
        id: expect.any(String),
        purchasedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        investedAmount: 25,
        btcAmount: 0.00005851,
        btcPriceAtPurchase: 427254,
        priceVariationPercent: 0, // −0,0002% arredonda para 0
        currentValue: 24.99, // vendendo agora, pela cotação de compra
        origin: 'PURCHASE',
      },
    ]);
    expect(position.body.summary).toEqual({
      invested: 25,
      btcAmount: 0.00005851,
      currentValue: 24.99,
      returnPercent: -0.04,
      currentBtcPrice: 427253,
    });

    const balance = await request(app).get('/account/balance').set('Authorization', auth);
    expect(balance.body).toEqual({ balance: 75 });

    const entries = await TransactionModel.find().sort({ _id: 1 }).lean();
    expect(entries.map((entry) => entry.type)).toEqual(['DEPOSIT', 'PURCHASE']);
    expect(entries[1]).toMatchObject({ amountCents: 2500, btcSats: 5851, btcPriceCents: 42725400 });
  });

  it('posição vazia antes da primeira compra', async () => {
    const position = await request(app).get('/btc').set('Authorization', auth);
    expect(position.body).toEqual({
      summary: {
        invested: 0,
        btcAmount: 0,
        currentValue: 0,
        returnPercent: 0,
        currentBtcPrice: null,
      },
      investments: [],
    });
  });

  it('422 com saldo insuficiente', async () => {
    await deposit(app, auth, 10);
    const response = await request(app)
      .post('/btc/purchase')
      .set('Authorization', auth)
      .send({ amount: 10.01 });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      statusCode: 422,
      message: 'Saldo insuficiente. Disponível: R$ 10,00.',
    });
  });

  it.each([
    [{ amount: 0 }, 'O valor deve ser maior que zero'],
    [{ amount: 1.001 }, 'Use no máximo 2 casas decimais'],
    [{ amount: 1e12 }, 'Valor acima do permitido'],
    [{}, 'Informe o valor em reais (número)'],
  ])('400: %o', async (body, message) => {
    const response = await request(app).post('/btc/purchase').set('Authorization', auth).send(body);
    expect(response.status).toBe(400);
    expect(response.body.details).toContainEqual({ field: 'amount', message });
  });

  it('compras simultâneas nunca deixam o saldo negativo', async () => {
    await deposit(app, auth, 100);

    // Saldo para só UMA compra de R$ 60; disparamos 5 ao mesmo tempo.
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).post('/btc/purchase').set('Authorization', auth).send({ amount: 60 }),
      ),
    );

    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 422)).toHaveLength(4);
    const user = await UserModel.findOne({ email: fulano.email }).lean();
    expect(user?.balanceCents).toBe(4000);
    expect(await InvestmentModel.countDocuments()).toBe(1);
  });

  it('se gravar o investimento falhar, o débito é desfeito (transação)', async () => {
    class FailingInvestmentRepository extends MongooseInvestmentRepository {
      override async create(): Promise<never> {
        throw new Error('falha simulada');
      }
    }
    const failingApp = createTestApp({
      quoteProvider: quote(),
      investmentRepository: new FailingInvestmentRepository(),
    });
    const failingAuth = await signUpAndLogin(failingApp, { ...fulano, email: 'outro@email.com' });
    await deposit(failingApp, failingAuth, 100);

    const response = await request(failingApp)
      .post('/btc/purchase')
      .set('Authorization', failingAuth)
      .send({ amount: 50 });

    expect(response.status).toBe(500);
    const user = await UserModel.findOne({ email: 'outro@email.com' }).lean();
    expect(user?.balanceCents).toBe(10000);
    expect(await TransactionModel.countDocuments({ type: 'PURCHASE' })).toBe(0);
  });
});
