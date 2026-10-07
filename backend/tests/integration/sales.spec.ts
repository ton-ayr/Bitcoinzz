import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvestmentModel } from '../../src/modules/investments/investment.model.js';
import { TransactionModel } from '../../src/modules/transactions/transaction.model.js';
import {
  MongooseTransactionRepository,
  type CreateTransactionData,
} from '../../src/modules/transactions/transaction.repository.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { fulano, signUpAndLogin } from '../helpers/auth.js';
import { useTestDatabase } from '../helpers/database.js';
import { FakeMailer, FakeQuoteProvider } from '../helpers/fakes.js';
import { createTestApp } from '../helpers/test-app.js';

useTestDatabase();

// Cotação fixa: compra (usada na venda) R$ 427.253,00 / venda (usada na compra) R$ 427.254,00.
const quote = () => new FakeQuoteProvider(42_725_300, 42_725_400);

/** Deposita R$ 1.000 e compra R$ 800 de BTC (= 187.242 sats, valendo R$ 799,99 agora). */
async function depositAndBuy(app: Express, auth: string) {
  await request(app).post('/account/deposit').set('Authorization', auth).send({ amount: 1000 });
  await request(app).post('/btc/purchase').set('Authorization', auth).send({ amount: 800 });
}

const sell = (app: Express, auth: string, body: object) =>
  request(app).post('/btc/sell').set('Authorization', auth).send(body);

describe('POST /btc/sell', () => {
  let mailer: FakeMailer;
  let app: Express;
  let auth: string;

  beforeEach(async () => {
    mailer = new FakeMailer();
    app = createTestApp({ quoteProvider: quote(), mailer });
    auth = await signUpAndLogin(app);
  });

  it('401 sem token', async () => {
    expect((await request(app).post('/btc/sell').send({ amount: 10 })).status).toBe(401);
  });

  it('venda parcial: saque + reinvestimento, refletidos na posição, no saldo e no extrato', async () => {
    await depositAndBuy(app, auth);
    const purchased = await InvestmentModel.findOne().lean();

    const response = await sell(app, auth, { amount: 300 }); // exemplo Postman usa { amount }

    // R$ 300 / R$ 427.253 → ceil = 70.217 sats vendidos; sobram 117.025 (a R$ 427.254 = R$ 499,99)
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      amount: 300,
      btcAmount: 0.00070217,
      btcPrice: 427253,
      reinvestment: { amount: 499.99, btcAmount: 0.00117025, btcPrice: 427254 },
      balance: 500, // R$ 200 que sobraram + R$ 300 resgatados
    });

    const position = await request(app).get('/btc').set('Authorization', auth);
    expect(position.body.investments).toEqual([
      expect.objectContaining({
        origin: 'REINVESTMENT',
        btcAmount: 0.00117025,
        btcPriceAtPurchase: 427254, // cotação ORIGINAL
        purchasedAt: purchased!.purchasedAt.toISOString(), // data ORIGINAL
      }),
    ]);

    const entries = await TransactionModel.find().sort({ _id: 1 }).lean();
    expect(entries.map((entry) => entry.type)).toEqual([
      'DEPOSIT',
      'PURCHASE',
      'SALE',
      'REINVESTMENT',
    ]);

    await vi.waitFor(() =>
      expect(mailer.sent.map((mail) => mail.subject)).toContain(
        'Venda de 0,00070217 BTC confirmada',
      ),
    );
  });

  it('vender a posição inteira encerra tudo, sem reinvestimento', async () => {
    await depositAndBuy(app, auth);

    const response = await sell(app, auth, { amount: 799.99 });

    expect(response.status).toBe(201);
    expect(response.body.reinvestment).toBeNull();
    expect(response.body.btcAmount).toBe(0.00187242);
    expect(await InvestmentModel.countDocuments({ status: 'OPEN' })).toBe(0);
  });

  it('422 acima da posição, informando o máximo', async () => {
    await depositAndBuy(app, auth);
    const response = await sell(app, auth, { amount: 800 });

    expect(response.status).toBe(422);
    expect(response.body.message).toBe(
      'Valor maior que a sua posição. Máximo disponível para venda: R$ 799,99.',
    );
  });

  it('400 com valor inválido', async () => {
    const response = await sell(app, auth, { amount: -1 });
    expect(response.status).toBe(400);
    expect(response.body.details).toContainEqual({
      field: 'amount',
      message: 'O valor deve ser maior que zero',
    });
  });

  it('vendas simultâneas não vendem mais BTC do que existe', async () => {
    await depositAndBuy(app, auth);

    // Posição de R$ 799,99: cabe só UMA venda de R$ 500.
    const responses = await Promise.all([
      sell(app, auth, { amount: 500 }),
      sell(app, auth, { amount: 500 }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 422]);
    const user = await UserModel.findOne({ email: fulano.email }).lean();
    expect(user?.balanceCents).toBe(70_000); // R$ 200 + R$ 500
    const open = await InvestmentModel.find({ status: 'OPEN' }).lean();
    // 187.242 comprados − 117.027 vendidos (ceil de R$ 500 / R$ 427.253) = 70.215 restantes
    expect(open.reduce((total, investment) => total + investment.btcSats, 0)).toBe(70_215);
  });

  it('se gravar o extrato falhar, nada da venda é aplicado (transação)', async () => {
    class FailOnSaleRepository extends MongooseTransactionRepository {
      override async create(data: CreateTransactionData) {
        if (data.type === 'SALE') throw new Error('falha simulada');
        return super.create(data);
      }
    }
    const failingApp = createTestApp({
      quoteProvider: quote(),
      transactionRepository: new FailOnSaleRepository(),
    });
    const failingAuth = await signUpAndLogin(failingApp, { ...fulano, email: 'outro@email.com' });
    await depositAndBuy(failingApp, failingAuth);

    const response = await sell(failingApp, failingAuth, { amount: 300 });

    expect(response.status).toBe(500);
    const user = await UserModel.findOne({ email: 'outro@email.com' }).lean();
    expect(user?.balanceCents).toBe(20_000); // não recebeu os R$ 300
    const investments = await InvestmentModel.find({ userId: user!._id }).lean();
    expect(investments).toHaveLength(1); // nenhum REINVESTMENT criado
    expect(investments[0]?.status).toBe('OPEN'); // compra original NÃO foi encerrada
  });
});
