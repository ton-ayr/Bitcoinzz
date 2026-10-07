import type { Express } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { TransactionModel } from '../../src/modules/transactions/transaction.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { startOfDay, subtractDays, toDateOnly } from '../../src/shared/dates.js';
import { fulano, signUpAndLogin } from '../helpers/auth.js';
import { useTestDatabase } from '../helpers/database.js';
import { FakeQuoteProvider } from '../helpers/fakes.js';
import { createTestApp } from '../helpers/test-app.js';

useTestDatabase();

const ciclano = { name: 'Ciclano', email: 'ciclano@email.com', password: 'ciclano123' };

const post = (app: Express, auth: string, path: string, body: object) =>
  request(app).post(path).set('Authorization', auth).send(body);

/** Grava um lançamento "no passado", direto no banco (sem passar pelas regras da API). */
async function insertOldTransaction(email: string, type: string, btcSats: number, createdAt: Date) {
  const user = await UserModel.findOne({ email }).lean();
  await TransactionModel.collection.insertOne({
    userId: user?._id ?? new Types.ObjectId(),
    type,
    amountCents: 12_345,
    // Depósito não tem BTC nem cotação.
    ...(btcSats > 0 ? { btcSats, btcPriceCents: 40_000_000 } : {}),
    createdAt,
  });
}

describe('GET /extract e GET /volume', () => {
  let app: Express;
  let auth: string;

  beforeEach(async () => {
    app = createTestApp({ quoteProvider: new FakeQuoteProvider(42_725_300, 42_725_400) });
    auth = await signUpAndLogin(app);
    // Depósito R$ 1.000 → compra R$ 800 (187.242 sats) → venda R$ 300 (70.217 sats + reinvestimento)
    await post(app, auth, '/account/deposit', { amount: 1000 });
    await post(app, auth, '/btc/purchase', { amount: 800 });
    await post(app, auth, '/btc/sell', { amount: 300 });
  });

  it.each(['/extract', '/volume'])('401 sem token: %s', async (path) => {
    expect((await request(app).get(path)).status).toBe(401);
  });

  it('extrato padrão: últimos 90 dias, mais recentes primeiro, com datas e cotações', async () => {
    const response = await request(app).get('/extract').set('Authorization', auth);

    expect(response.status).toBe(200);
    expect(response.body.to).toBe(toDateOnly(new Date()));
    expect(response.body.from).toBe(toDateOnly(subtractDays(new Date(), 90)));
    expect(response.body.transactions).toEqual([
      {
        id: expect.any(String),
        type: 'REINVESTMENT',
        amount: 499.99,
        btcAmount: 0.00117025,
        btcPrice: 427254, // cotação ORIGINAL da compra
        createdAt: expect.any(String),
      },
      expect.objectContaining({
        type: 'SALE',
        amount: 300,
        btcAmount: 0.00070217,
        btcPrice: 427253,
      }),
      expect.objectContaining({
        type: 'PURCHASE',
        amount: 800,
        btcAmount: 0.00187242,
        btcPrice: 427254,
      }),
      // Depósito não tem BTC nem cotação: null (formato igual para todos os tipos).
      expect.objectContaining({ type: 'DEPOSIT', amount: 1000, btcAmount: null, btcPrice: null }),
    ]);
  });

  it('lançamento de 100 dias atrás: fora do padrão, dentro do intervalo customizado', async () => {
    const hundredDaysAgo = subtractDays(new Date(), 100);
    await insertOldTransaction(fulano.email, 'DEPOSIT', 0, hundredDaysAgo);

    const standard = await request(app).get('/extract').set('Authorization', auth);
    expect(standard.body.transactions).toHaveLength(4);

    const custom = await request(app)
      .get(`/extract?from=${toDateOnly(hundredDaysAgo)}&to=${toDateOnly(new Date())}`)
      .set('Authorization', auth);
    expect(custom.status).toBe(200);
    expect(custom.body.transactions).toHaveLength(5);
    expect(custom.body.transactions.at(-1)).toMatchObject({ type: 'DEPOSIT', amount: 123.45 });

    const onlyThatDay = await request(app)
      .get(`/extract?from=${toDateOnly(hundredDaysAgo)}&to=${toDateOnly(hundredDaysAgo)}`)
      .set('Authorization', auth);
    expect(onlyThatDay.body.transactions).toHaveLength(1);
  });

  it('cada cliente vê só o próprio extrato', async () => {
    const otherAuth = await signUpAndLogin(app, ciclano);
    const response = await request(app).get('/extract').set('Authorization', otherAuth);
    expect(response.body.transactions).toEqual([]);
  });

  it.each([
    ['?from=2026-13-01', 'from', 'Data inválida: use o formato AAAA-MM-DD (ex.: 2026-10-06)'],
    ['?to=06/10/2026', 'to', 'Data inválida: use o formato AAAA-MM-DD (ex.: 2026-10-06)'],
    [
      '?from=2026-10-02&to=2026-10-01',
      'from',
      'A data inicial deve ser anterior ou igual à data final',
    ],
    ['?from=2024-01-01&to=2026-10-06', 'from', 'O período máximo é de 366 dias'],
  ])('400: %s', async (query, field, message) => {
    const response = await request(app).get(`/extract${query}`).set('Authorization', auth);
    expect(response.status).toBe(400);
    expect(response.body.details).toContainEqual({ field, message });
  });

  it('volume do dia: soma todos os clientes, sem reinvestimentos e sem outros dias', async () => {
    const otherAuth = await signUpAndLogin(app, ciclano);
    await post(app, otherAuth, '/account/deposit', { amount: 100 });
    await post(app, otherAuth, '/btc/purchase', { amount: 25 }); // 5.851 sats
    // Uma compra grande de ONTEM não pode entrar no volume de hoje.
    await insertOldTransaction(fulano.email, 'PURCHASE', 10_000_000, subtractDays(startOfDay(), 1));

    const response = await request(app).get('/volume').set('Authorization', auth);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      date: toDateOnly(new Date()),
      bought: 0.00193093, // 187.242 + 5.851 sats
      sold: 0.00070217, // o REINVESTMENT (117.025 sats) não conta
    });
  });
});
