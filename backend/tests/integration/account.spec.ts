import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionModel } from '../../src/modules/transactions/transaction.model.js';
import { MongooseTransactionRepository } from '../../src/modules/transactions/transaction.repository.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { fulano, signUpAndLogin } from '../helpers/auth.js';
import { useTestDatabase } from '../helpers/database.js';
import { FakeMailer } from '../helpers/fakes.js';
import { createTestApp } from '../helpers/test-app.js';

useTestDatabase();

describe('rotas da conta', () => {
  let mailer: FakeMailer;
  let app: Express;
  let auth: string;

  beforeEach(async () => {
    mailer = new FakeMailer();
    app = createTestApp({ mailer });
    auth = await signUpAndLogin(app);
  });

  it.each([
    ['get', '/account'],
    ['get', '/account/balance'],
    ['post', '/account/deposit'],
  ] as const)('401 sem token: %s %s', async (method, path) => {
    const response = await request(app)[method](path);
    expect(response.status).toBe(401);
  });

  it('GET /account devolve o perfil', async () => {
    const response = await request(app).get('/account').set('Authorization', auth);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: fulano.name,
      email: fulano.email,
    });
  });

  it('depósitos acumulam e o saldo é consultável (exemplo da coleção Postman: 87.5)', async () => {
    const first = await request(app)
      .post('/account/deposit')
      .set('Authorization', auth)
      .send({ amount: 87.5 });
    expect(first.status).toBe(201);
    expect(first.body).toEqual({ balance: 87.5 });

    const second = await request(app)
      .post('/account/deposit')
      .set('Authorization', auth)
      .send({ amount: 0.1 });
    expect(second.body).toEqual({ balance: 87.6 }); // sem erro de ponto flutuante

    const balance = await request(app).get('/account/balance').set('Authorization', auth);
    expect(balance.body).toEqual({ balance: 87.6 });

    const user = await UserModel.findOne({ email: fulano.email }).lean();
    expect(user?.balanceCents).toBe(8760);
    const entries = await TransactionModel.find({ userId: user?._id }).sort({ _id: 1 }).lean();
    expect(entries.map((entry) => [entry.type, entry.amountCents])).toEqual([
      ['DEPOSIT', 8750],
      ['DEPOSIT', 10],
    ]);
  });

  it('envia o e-mail com o valor depositado', async () => {
    await request(app).post('/account/deposit').set('Authorization', auth).send({ amount: 200 });
    await vi.waitFor(() => expect(mailer.sent).toHaveLength(1));
    expect(mailer.sent[0]).toMatchObject({
      to: fulano.email,
      subject: 'Depósito de R$ 200,00 confirmado',
    });
  });

  it.each([
    [{ amount: -10 }, 'O valor deve ser maior que zero'],
    [{ amount: 0 }, 'O valor deve ser maior que zero'],
    [{ amount: 10.555 }, 'Use no máximo 2 casas decimais'],
    [{ amount: 1_000_000.01 }, 'O valor máximo por depósito é R$ 1.000.000,00'],
    [{ amount: '100' }, 'Informe o valor em reais (número)'],
    [{}, 'Informe o valor em reais (número)'],
  ])('400: %o', async (body, message) => {
    const response = await request(app)
      .post('/account/deposit')
      .set('Authorization', auth)
      .send(body);
    expect(response.status).toBe(400);
    expect(response.body.details).toContainEqual({ field: 'amount', message });
  });

  it('aceita o limite exato de R$ 1.000.000,00', async () => {
    const response = await request(app)
      .post('/account/deposit')
      .set('Authorization', auth)
      .send({ amount: 1_000_000 });
    expect(response.status).toBe(201);
  });
});

describe('transação do depósito (tudo ou nada)', () => {
  it('se o lançamento do extrato falhar, o saldo NÃO é alterado e nenhum e-mail sai', async () => {
    class FailingTransactionRepository extends MongooseTransactionRepository {
      override async create(): Promise<never> {
        throw new Error('falha simulada ao gravar o extrato');
      }
    }
    const mailer = new FakeMailer();
    const app = createTestApp({
      transactionRepository: new FailingTransactionRepository(),
      mailer,
    });
    const auth = await signUpAndLogin(app);

    const response = await request(app)
      .post('/account/deposit')
      .set('Authorization', auth)
      .send({ amount: 100 });

    expect(response.status).toBe(500);
    const user = await UserModel.findOne({ email: fulano.email }).lean();
    expect(user?.balanceCents).toBe(0); // o $inc foi desfeito (rollback)
    expect(mailer.sent).toHaveLength(0);
  });
});
