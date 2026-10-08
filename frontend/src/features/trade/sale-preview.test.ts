import { describe, expect, it } from 'vitest';
import { salePreview, toOpenInvestments, type OpenInvestment } from './sale-preview';

const normalize = (text: string | null) => text?.replace(/ /g, ' ') ?? null;

const investment = (id: string, btcSats: number, purchasePriceCents: number): OpenInvestment => ({
  id,
  purchasedAt: `2026-10-0${id.charCodeAt(0) - 96}T13:00:00Z`, // a → dia 01, b → dia 02...
  btcSats,
  investedCents: Number((BigInt(btcSats) * BigInt(purchasePriceCents)) / BigInt(100_000_000)),
  purchasePriceCents,
});

// Exemplo das regras de negócio: A tem 0,002 BTC comprados a R$ 400.000 (R$ 800); a cotação de compra é R$ 500.000.
const a = investment('a', 200_000, 40_000_000); // vale R$ 1.000 agora
const b = investment('b', 100_000, 45_000_000); // vale R$ 500 agora
const c = investment('c', 50_000, 48_000_000); // vale R$ 250 agora
const PRICE = 50_000_000;

describe('salePreview (FIFO, mesmas regras da API)', () => {
  it('exemplo das regras de negócio: venda parcial de R$ 600 → reinvestimento de R$ 320 com a cotação original', () => {
    const preview = salePreview({ amountCents: 60_000, investments: [a], priceCents: PRICE });

    expect(preview.error).toBeNull();
    expect(preview.soldSats).toBe(120_000); // 0,0012 BTC
    expect(preview.steps).toEqual([
      { investment: a, kind: 'PARTIAL', soldSats: 120_000, leftoverSats: 80_000 },
    ]);
    expect(preview.reinvestment).toEqual({
      btcSats: 80_000,
      priceCents: 40_000_000,
      investedCents: 32_000,
    });
  });

  it('consome do mais antigo para o mais novo; os seguintes ficam abertos', () => {
    // R$ 1.200 = A inteiro (R$ 1.000) + R$ 200 de B
    const preview = salePreview({
      amountCents: 120_000,
      investments: [a, b, c],
      priceCents: PRICE,
    });

    expect(preview.steps.map((step) => step.kind)).toEqual(['SOLD', 'PARTIAL', 'KEPT']);
    expect(preview.steps[1]).toMatchObject({ soldSats: 40_000, leftoverSats: 60_000 });
    expect(preview.soldSats).toBe(240_000);
    expect(preview.reinvestment).toEqual({
      btcSats: 60_000,
      priceCents: 45_000_000,
      investedCents: 27_000,
    });
  });

  it('vender a posição inteira não gera reinvestimento', () => {
    const preview = salePreview({
      amountCents: 175_000,
      investments: [a, b, c],
      priceCents: PRICE,
    });

    expect(preview.positionValueCents).toBe(175_000);
    expect(preview.steps.every((step) => step.kind === 'SOLD')).toBe(true);
    expect(preview.soldSats).toBe(350_000);
    expect(preview.reinvestment).toBeNull();
  });

  it('se o arredondamento para cima consome todo o BTC, não sobra reinvestimento', () => {
    // 1 sat a R$ 2.500.000 vale 2 centavos; vender 1 centavo exige 1 sat (arredondado para cima)
    const tiny = investment('a', 1, 250_000_000);
    const preview = salePreview({ amountCents: 1, investments: [tiny], priceCents: 250_000_000 });

    expect(preview.steps).toEqual([
      { investment: tiny, kind: 'SOLD', soldSats: 1, leftoverSats: 0 },
    ]);
    expect(preview.reinvestment).toBeNull();
  });

  it('acima da posição: mesma mensagem da API, com o máximo', () => {
    const preview = salePreview({ amountCents: 150_001, investments: [a, b], priceCents: PRICE });
    expect(normalize(preview.error)).toBe(
      'Valor maior que a sua posição. Máximo disponível para venda: R$ 1.500,00.',
    );
    expect(preview.steps.every((step) => step.kind === 'KEPT')).toBe(true);
  });

  it('sem investimentos ou sem valor', () => {
    expect(salePreview({ amountCents: 100, investments: [], priceCents: PRICE }).error).toBe(
      'Você não tem bitcoins para vender.',
    );
    expect(salePreview({ amountCents: 0, investments: [a], priceCents: PRICE }).error).toBe(
      'Informe o valor da venda',
    );
  });
});

describe('toOpenInvestments', () => {
  it('converte a posição da API (decimais) para inteiros', () => {
    expect(
      toOpenInvestments([
        {
          id: 'x',
          purchasedAt: '2026-10-01T13:00:00Z',
          investedAmount: 1500,
          btcAmount: 0.00358609,
          btcPriceAtPurchase: 418282.5,
          priceVariationPercent: 0,
          currentValue: 1500,
          origin: 'PURCHASE',
        },
      ]),
    ).toEqual([
      {
        id: 'x',
        purchasedAt: '2026-10-01T13:00:00Z',
        btcSats: 358_609,
        investedCents: 150_000,
        purchasePriceCents: 41_828_250,
      },
    ]);
  });
});
