import { describe, expect, it } from 'vitest';
import {
  btcToSats,
  centsToSats,
  parseMoneyInput,
  satsToBtc,
  satsToCents,
  toCents,
  toReais,
} from './money';

describe('conversões', () => {
  it('R$ da API → centavos, sem erro de ponto flutuante', () => {
    expect(toCents(418282.5)).toBe(41828250);
    expect(toCents(1250.1)).toBe(125010); // 1250.1 × 100 = 125010.00000000001
    expect(toCents(0.29)).toBe(29); // 0.29 × 100 = 28.999999999999996
  });

  it('centavos → R$ para a API e satoshis → BTC para exibir', () => {
    expect(toReais(12345)).toBe(123.45);
    expect(satsToBtc(358609)).toBe(0.00358609);
  });
});

describe('centsToSats (BTC estimado na compra)', () => {
  it('mesmo resultado da API: R$ 1.500 a R$ 418.282 → 0,00358609 BTC', () => {
    expect(centsToSats(150_000, 41_828_200)).toBe(358_609);
  });

  it('arredonda para baixo (o cliente nunca recebe a mais)', () => {
    // 1 centavo a R$ 418.282 = 2,39 sats → 2
    expect(centsToSats(1, 41_828_200)).toBe(2);
  });

  it('valor ou cotação zerados → 0', () => {
    expect(centsToSats(0, 41_828_200)).toBe(0);
    expect(centsToSats(100, 0)).toBe(0);
  });

  it('na venda arredonda para cima (os sats vendidos cobrem o valor), só se houver resto', () => {
    expect(centsToSats(1, 41_828_200, 'ceil')).toBe(3); // 2,39 → 3
    expect(centsToSats(60_000, 50_000_000, 'ceil')).toBe(120_000); // divisão exata: não soma 1
  });
});

describe('satsToCents e btcToSats', () => {
  it('valor dos sats na cotação, para baixo no centavo (igual à API)', () => {
    expect(satsToCents(200_000, 50_000_000)).toBe(100_000); // 0,002 BTC a R$ 500.000 = R$ 1.000
    expect(satsToCents(3, 60_000_000)).toBe(1); // 1,8 centavo → 1
  });

  it('BTC da API → sats, sem erro de ponto flutuante', () => {
    expect(btcToSats(0.00358609)).toBe(358_609); // 0.00358609 × 1e8 = 358608.99999999994
  });
});

describe('parseMoneyInput (campo "estilo app de banco")', () => {
  it.each([
    ['', 0],
    ['R$ 0,00', 0],
    ['R$ 0,001', 1], // digitou "1"
    ['R$ 0,0', 0], // apagou o último dígito
    ['R$ 1,234', 1234],
    ['R$ 1.234,567', 1234567], // digitou "7" em R$ 1.234,56 → R$ 12.345,67
    ['-5', 5],
    ['R$ 999.999.999,99', 99_999_999_999],
  ])('"%s" → %i centavos', (text, cents) => {
    expect(parseMoneyInput(text)).toBe(cents);
  });

  it('acima de 11 dígitos é ignorado (null)', () => {
    expect(parseMoneyInput('R$ 999.999.999,991')).toBeNull();
  });
});
