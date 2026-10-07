import { describe, expect, it } from 'vitest';
import { depositPreview, MAX_DEPOSIT_CENTS, percentOf, purchasePreview } from './preview';

// O Intl usa espaço não separável (U+00A0) em "R$ 1,00".
const normalize = (text: string | null) => text?.replace(/ /g, ' ') ?? null;

describe('depositPreview', () => {
  it('saldo depois = saldo atual + depósito', () => {
    expect(depositPreview(50_000, 125_050)).toEqual({ balanceAfterCents: 175_050, error: null });
  });

  it('valor vazio pede o valor', () => {
    expect(depositPreview(0, 100).error).toBe('Informe o valor do depósito');
  });

  it('limite de R$ 1.000.000,00 por depósito (igual à API)', () => {
    expect(depositPreview(MAX_DEPOSIT_CENTS, 0).error).toBeNull();
    expect(normalize(depositPreview(MAX_DEPOSIT_CENTS + 1, 0).error)).toBe(
      'O valor máximo por depósito é R$ 1.000.000,00',
    );
  });
});

describe('purchasePreview', () => {
  const base = { balanceCents: 330_000, priceCents: 41_828_200 };

  it('BTC estimado pela cotação de venda e saldo depois da compra', () => {
    expect(purchasePreview({ ...base, amountCents: 150_000 })).toEqual({
      btcSats: 358_609,
      balanceAfterCents: 180_000,
      error: null,
    });
  });

  it('pode usar o saldo inteiro', () => {
    expect(purchasePreview({ ...base, amountCents: 330_000 }).error).toBeNull();
  });

  it('valor vazio pede o valor', () => {
    expect(purchasePreview({ ...base, amountCents: 0 }).error).toBe('Informe o valor da compra');
  });

  it('acima do saldo: mesma mensagem da API', () => {
    expect(normalize(purchasePreview({ ...base, amountCents: 330_001 }).error)).toBe(
      'Saldo insuficiente. Disponível: R$ 3.300,00.',
    );
  });

  it('valor que não compra nem 1 satoshi é recusado', () => {
    // 1 centavo a R$ 2.000.000 = 0,5 sat → 0
    const preview = purchasePreview({ amountCents: 1, balanceCents: 100, priceCents: 200_000_000 });
    expect(preview.btcSats).toBe(0);
    expect(preview.error).toMatch(/^Valor muito baixo/);
  });

  it('sem cotação ainda: sem estimativa, mas sem erro', () => {
    expect(purchasePreview({ ...base, amountCents: 1_000, priceCents: null })).toEqual({
      btcSats: null,
      balanceAfterCents: 329_000,
      error: null,
    });
  });
});

describe('percentOf (atalhos 25%, 50% e Tudo)', () => {
  it('arredonda para baixo no centavo', () => {
    expect(percentOf(330_001, 25)).toBe(82_500);
    expect(percentOf(330_001, 50)).toBe(165_000);
    expect(percentOf(330_001, 100)).toBe(330_001);
  });
});
