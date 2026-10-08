import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaleService } from '../../src/modules/investments/sale.service.js';
import { NotificationService } from '../../src/modules/notifications/notification.service.js';
import { QuoteService } from '../../src/modules/quotes/quote.service.js';
import { BusinessRuleError, ServiceUnavailableError } from '../../src/shared/errors/app-error.js';
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
const OCT_1 = new Date('2026-10-01T10:00:00Z');
const OCT_2 = new Date('2026-10-02T10:00:00Z');

describe('SaleService (venda FIFO com reinvestimento)', () => {
  let users: InMemoryUserRepository;
  let investments: InMemoryInvestmentRepository;
  let transactions: InMemoryTransactionRepository;
  let quoteProvider: FakeQuoteProvider;
  let mailer: FakeMailer;
  let service: SaleService;
  let userId: string;

  /** Monta o cenário. Cotação de COMPRA padrão: R$ 500.000 (é a usada na venda). */
  async function setup(buyCents = 50_000_000) {
    users = new InMemoryUserRepository();
    investments = new InMemoryInvestmentRepository();
    transactions = new InMemoryTransactionRepository();
    quoteProvider = new FakeQuoteProvider(buyCents, buyCents + 100);
    mailer = new FakeMailer();
    service = new SaleService(
      users,
      investments,
      transactions,
      new PassThroughTransactionRunner(),
      new QuoteService(quoteProvider, 10_000),
      new NotificationService(mailer, silentLogger),
      () => NOW,
    );
    ({ id: userId } = await users.create({ name: 'Fulano', email: 'f@f.com', passwordHash: 'x' }));
  }

  function invest(btcSats: number, priceCents: number, purchasedAt: Date, owner = userId) {
    return investments.create({
      userId: owner,
      btcSats,
      investedCents: (btcSats * priceCents) / 100_000_000,
      purchasePriceCents: priceCents,
      purchasedAt,
      origin: 'PURCHASE',
    });
  }

  const balance = async () => (await users.findById(userId))!.balanceCents;
  const openSats = () =>
    investments.investments
      .filter((investment) => investment.status === 'OPEN' && investment.userId === userId)
      .reduce((total, investment) => total + investment.btcSats, 0);

  beforeEach(() => setup());

  it('exemplo das regras de negócio: vende R$ 600 de 0,002 BTC (comprado a R$ 400.000, cotado a R$ 500.000)', async () => {
    const a = await invest(200_000, 40_000_000, OCT_1); // R$ 800 investidos; vale R$ 1.000

    const result = await service.sell(userId, 60_000);

    expect(result).toEqual({
      amountCents: 60_000,
      btcSats: 120_000, // 0,0012 BTC vendidos
      btcPriceCents: 50_000_000,
      reinvestment: { btcSats: 80_000, btcPriceCents: 40_000_000, investedCents: 32_000 },
      balanceCents: 60_000,
    });

    // A é encerrado; nasce B (REINVESTMENT) com a cotação E a data originais.
    expect(a.status).toBe('CLOSED');
    expect(a.closedAt).toEqual(NOW);
    const open = await investments.findOpenByUser(userId);
    expect(open).toEqual([
      expect.objectContaining({
        btcSats: 80_000,
        investedCents: 32_000,
        purchasePriceCents: 40_000_000,
        purchasedAt: OCT_1,
        origin: 'REINVESTMENT',
        parentId: a.id,
      }),
    ]);

    // Extrato: saque parcial + reinvestimento.
    expect(transactions.transactions).toEqual([
      expect.objectContaining({
        type: 'SALE',
        amountCents: 60_000,
        btcSats: 120_000,
        btcPriceCents: 50_000_000,
      }),
      expect.objectContaining({
        type: 'REINVESTMENT',
        amountCents: 32_000,
        btcSats: 80_000,
        btcPriceCents: 40_000_000,
      }),
    ]);
  });

  it('venda do valor exato de um investimento: encerra sem reinvestimento', async () => {
    const a = await invest(200_000, 40_000_000, OCT_1); // vale R$ 1.000

    const result = await service.sell(userId, 100_000);

    expect(result.btcSats).toBe(200_000);
    expect(result.reinvestment).toBeNull();
    expect(a.status).toBe('CLOSED');
    expect(await investments.findOpenByUser(userId)).toEqual([]);
    expect(transactions.transactions.map((transaction) => transaction.type)).toEqual(['SALE']);
  });

  it('respeita a ordem de COMPRA (FIFO), não a ordem de cadastro', async () => {
    const newer = await invest(100_000, 60_000_000, OCT_2); // cadastrado primeiro, comprado depois
    const older = await invest(100_000, 40_000_000, OCT_1); // vale R$ 500

    // R$ 700 = todo o mais antigo (R$ 500) + R$ 200 do mais novo
    const result = await service.sell(userId, 70_000);

    expect(older.status).toBe('CLOSED');
    expect(newer.status).toBe('CLOSED');
    // R$ 200 a R$ 500.000 = 40.000 sats do mais novo; sobram 60.000 (reinvestidos a R$ 600.000)
    expect(result.btcSats).toBe(140_000);
    expect(result.reinvestment).toEqual({
      btcSats: 60_000,
      btcPriceCents: 60_000_000,
      investedCents: 36_000,
    });
    const [reinvested] = await investments.findOpenByUser(userId);
    expect(reinvested).toMatchObject({ parentId: newer.id, purchasedAt: OCT_2 });
  });

  it.each([1, 99_999, 100_000, 100_001, 149_999, 150_000])(
    'vendendo %i centavos: crédito = valor pedido e nenhum BTC é criado ou perdido',
    async (amountCents) => {
      await invest(200_000, 40_000_000, OCT_1); // vale R$ 1.000
      await invest(100_000, 60_000_000, OCT_2); // vale R$ 500
      const satsBefore = openSats();

      const result = await service.sell(userId, amountCents);

      expect(await balance()).toBe(amountCents);
      expect(result.btcSats + openSats()).toBe(satsBefore);
    },
  );

  it('se o arredondamento consome todo o BTC, encerra sem reinvestimento de 0 sats', async () => {
    // 1 sat a R$ 3.000.000 vale 3 centavos; vender 2 centavos exige ceil(0,67) = 1 sat.
    await setup(300_000_000);
    await invest(1, 300_000_000, OCT_1);

    const result = await service.sell(userId, 2);

    expect(result.btcSats).toBe(1);
    expect(result.reinvestment).toBeNull();
    expect(await balance()).toBe(2);
    expect(openSats()).toBe(0);
  });

  it('valor maior que a posição → 422 com o máximo disponível, sem mexer em nada', async () => {
    const a = await invest(200_000, 40_000_000, OCT_1); // vale R$ 1.000

    await expect(service.sell(userId, 100_001)).rejects.toThrow(
      new BusinessRuleError(
        'Valor maior que a sua posição. Máximo disponível para venda: R$ 1.000,00.',
      ),
    );
    expect(a.status).toBe('OPEN');
    expect(await balance()).toBe(0);
    expect(transactions.transactions).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it('sem investimentos → 422', async () => {
    await expect(service.sell(userId, 100)).rejects.toThrow(
      new BusinessRuleError('Você não tem bitcoins para vender.'),
    );
  });

  it('não mexe nos investimentos de outros usuários', async () => {
    const someoneElse = await invest(500_000, 40_000_000, new Date('2026-09-01'), 'outro-usuario');
    await invest(200_000, 40_000_000, OCT_1);

    await service.sell(userId, 100_000);

    expect(someoneElse.status).toBe('OPEN');
  });

  it('cotação indisponível → 503 e nada muda', async () => {
    const a = await invest(200_000, 40_000_000, OCT_1);
    quoteProvider.failure = new ServiceUnavailableError('fora do ar');

    await expect(service.sell(userId, 1000)).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(a.status).toBe('OPEN');
  });

  it('envia o e-mail com o BTC vendido e o R$ resgatado', async () => {
    await invest(200_000, 40_000_000, OCT_1);
    await service.sell(userId, 60_000);

    await vi.waitFor(() => expect(mailer.sent).toHaveLength(1));
    expect(mailer.sent[0]?.text).toContain('Você vendeu 0,00120000 BTC e resgatou R$ 600,00.');
  });
});
