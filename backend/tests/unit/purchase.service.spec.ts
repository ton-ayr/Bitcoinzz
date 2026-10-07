import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseService } from '../../src/modules/investments/purchase.service.js';
import { NotificationService } from '../../src/modules/notifications/notification.service.js';
import { QuoteService } from '../../src/modules/quotes/quote.service.js';
import {
  BusinessRuleError,
  ServiceUnavailableError,
  UnauthorizedError,
} from '../../src/shared/errors/app-error.js';
import {
  FakeMailer,
  FakeQuoteProvider,
  InMemoryInvestmentRepository,
  InMemoryTransactionRepository,
  InMemoryUserRepository,
  PassThroughTransactionRunner,
} from '../helpers/fakes.js';
import { silentLogger } from '../helpers/test-app.js';

const NOW = new Date('2026-10-06T12:00:00Z');

describe('PurchaseService', () => {
  let users: InMemoryUserRepository;
  let investments: InMemoryInvestmentRepository;
  let transactions: InMemoryTransactionRepository;
  let quoteProvider: FakeQuoteProvider;
  let mailer: FakeMailer;
  let service: PurchaseService;
  let userId: string;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    investments = new InMemoryInvestmentRepository();
    transactions = new InMemoryTransactionRepository();
    // Compra (buy) R$ 299.000 e VENDA (sell) R$ 300.000: a compra do cliente usa a de venda.
    quoteProvider = new FakeQuoteProvider(29900000, 30000000);
    mailer = new FakeMailer();
    service = new PurchaseService(
      users,
      investments,
      transactions,
      new PassThroughTransactionRunner(),
      new QuoteService(quoteProvider, 10_000),
      new NotificationService(mailer, silentLogger),
      () => NOW,
    );
    ({ id: userId } = await users.create({ name: 'Fulano', email: 'f@f.com', passwordHash: 'x' }));
    await users.incrementBalance(userId, 100_000); // R$ 1.000,00
  });

  it('converte R$ em BTC pela cotação de VENDA, arredondando para baixo', async () => {
    // R$ 100 / R$ 300.000 = 0,000333333... BTC → 33.333 sats
    const result = await service.purchase(userId, 10_000);

    expect(result).toEqual({
      amountCents: 10_000,
      btcSats: 33_333,
      btcPriceCents: 30_000_000,
      balanceCents: 90_000,
    });
  });

  it('cria o investimento (com a cotação e a data da compra) e o lançamento PURCHASE', async () => {
    await service.purchase(userId, 10_000);

    expect(investments.investments).toEqual([
      expect.objectContaining({
        userId,
        btcSats: 33_333,
        investedCents: 10_000,
        purchasePriceCents: 30_000_000,
        purchasedAt: NOW,
        status: 'OPEN',
        origin: 'PURCHASE',
      }),
    ]);
    expect(transactions.transactions).toEqual([
      expect.objectContaining({
        type: 'PURCHASE',
        amountCents: 10_000,
        btcSats: 33_333,
        btcPriceCents: 30_000_000,
      }),
    ]);
  });

  it('envia o e-mail com o R$ investido e o BTC comprado', async () => {
    await service.purchase(userId, 10_000);
    await vi.waitFor(() => expect(mailer.sent).toHaveLength(1));
    expect(mailer.sent[0]?.text).toContain('Você investiu R$ 100,00 e comprou 0,00033333 BTC.');
  });

  it('pode usar o saldo inteiro', async () => {
    const result = await service.purchase(userId, 100_000);
    expect(result.balanceCents).toBe(0);
  });

  it('saldo insuficiente → 422 informando o disponível, sem criar nada', async () => {
    await expect(service.purchase(userId, 100_001)).rejects.toThrow(
      new BusinessRuleError('Saldo insuficiente. Disponível: R$ 1.000,00.'),
    );
    expect(investments.investments).toHaveLength(0);
    expect(transactions.transactions).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
    expect((await users.findById(userId))?.balanceCents).toBe(100_000);
  });

  it('valor que não compra nem 1 satoshi → 422', async () => {
    // R$ 0,01 a R$ 3.000.000 = 0,33 sat
    quoteProvider.sellCents = 300_000_000;
    await expect(service.purchase(userId, 1)).rejects.toBeInstanceOf(BusinessRuleError);
    expect((await users.findById(userId))?.balanceCents).toBe(100_000);
  });

  it('cotação indisponível → 503 e o saldo não muda', async () => {
    quoteProvider.failure = new ServiceUnavailableError('fora do ar');
    await expect(service.purchase(userId, 10_000)).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect((await users.findById(userId))?.balanceCents).toBe(100_000);
  });

  it('usuário inexistente → 401', async () => {
    await expect(service.purchase('nao-existe', 100)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
