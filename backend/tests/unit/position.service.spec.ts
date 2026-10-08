import { beforeEach, describe, expect, it } from 'vitest';
import { PositionService } from '../../src/modules/investments/position.service.js';
import { QuoteService } from '../../src/modules/quotes/quote.service.js';
import { FakeQuoteProvider, InMemoryInvestmentRepository } from '../helpers/fakes.js';

describe('PositionService', () => {
  let investments: InMemoryInvestmentRepository;
  let quoteProvider: FakeQuoteProvider;
  let service: PositionService;

  beforeEach(() => {
    investments = new InMemoryInvestmentRepository();
    // Cotação de COMPRA atual: R$ 500.000 (é por ela que o cliente venderia agora).
    quoteProvider = new FakeQuoteProvider(50_000_000, 50_000_100);
    service = new PositionService(investments, new QuoteService(quoteProvider, 10_000));
  });

  function invest(userId: string, btcSats: number, priceCents: number, purchasedAt: string) {
    return investments.create({
      userId,
      btcSats,
      investedCents: (btcSats * priceCents) / 100_000_000,
      purchasePriceCents: priceCents,
      purchasedAt: new Date(purchasedAt),
      origin: 'PURCHASE',
    });
  }

  it('sem investimentos: tudo zerado e NÃO consulta a cotação', async () => {
    const position = await service.getPosition('u1');

    expect(position.investments).toEqual([]);
    expect(position.summary).toEqual({
      investedCents: 0,
      btcSats: 0,
      currentValueCents: 0,
      returnPercent: 0,
      currentBtcPriceCents: null,
    });
    expect(quoteProvider.calls).toBe(0);
  });

  it('exemplo das regras de negócio: 0,002 BTC comprado a R$ 400.000 vale R$ 1.000 a R$ 500.000 (+25%)', async () => {
    await invest('u1', 200_000, 40_000_000, '2026-10-01T10:00:00Z');

    const [item] = (await service.getPosition('u1')).investments;

    expect(item).toMatchObject({
      investedCents: 80_000,
      btcSats: 200_000,
      purchasePriceCents: 40_000_000,
      priceVariationPercent: 25,
      currentValueCents: 100_000,
    });
  });

  it('variação negativa, arredondada em 2 casas', async () => {
    // Comprado a R$ 600.000; agora R$ 500.000 → −16,666...% → −16,67%
    await invest('u1', 100_000, 60_000_000, '2026-10-01T10:00:00Z');
    const [item] = (await service.getPosition('u1')).investments;
    expect(item?.priceVariationPercent).toBe(-16.67);
  });

  it('resumo soma os investimentos e calcula o resultado da carteira', async () => {
    await invest('u1', 200_000, 40_000_000, '2026-10-01T10:00:00Z'); // R$ 800 → vale R$ 1.000
    await invest('u1', 100_000, 60_000_000, '2026-10-02T10:00:00Z'); // R$ 600 → vale R$ 500

    const { summary, investments: items } = await service.getPosition('u1');

    expect(items.map((item) => item.purchasePriceCents)).toEqual([40_000_000, 60_000_000]);
    expect(summary).toEqual({
      investedCents: 140_000,
      btcSats: 300_000,
      currentValueCents: 150_000,
      returnPercent: 7.14, // (1.500 − 1.400) / 1.400
      currentBtcPriceCents: 50_000_000,
    });
  });

  it('mostra só os investimentos ABERTOS do próprio usuário', async () => {
    await invest('u1', 100_000, 40_000_000, '2026-10-01T10:00:00Z');
    const closed = await invest('u1', 100_000, 40_000_000, '2026-10-02T10:00:00Z');
    closed.status = 'CLOSED';
    await invest('outro-usuario', 100_000, 40_000_000, '2026-10-03T10:00:00Z');

    expect((await service.getPosition('u1')).investments).toHaveLength(1);
  });
});
