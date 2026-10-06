import { describe, expect, it } from 'vitest';
import {
  centsToReais,
  centsToSats,
  decimalStringToCents,
  hasAtMostTwoDecimals,
  reaisToCents,
  satsToBtc,
  satsToCents,
} from '../../src/shared/money.js';

describe('money', () => {
  describe('reaisToCents / centsToReais', () => {
    it('converte reais em centavos sem erro de ponto flutuante', () => {
      expect(reaisToCents(87.5)).toBe(8750);
      expect(reaisToCents(0.1 + 0.2)).toBe(30);
      expect(reaisToCents(1.01)).toBe(101);
    });

    it('converte centavos de volta para reais', () => {
      expect(centsToReais(8750)).toBe(87.5);
    });

    it('rejeita valores não finitos', () => {
      expect(() => reaisToCents(Number.NaN)).toThrow(RangeError);
    });
  });

  describe('hasAtMostTwoDecimals', () => {
    it.each([
      [10, true],
      [10.5, true],
      [0.01, true],
      [1000000, true],
      [10.505, false],
      [0.001, false],
    ])('%s → %s', (value, expected) => {
      expect(hasAtMostTwoDecimals(value)).toBe(expected);
    });
  });

  describe('decimalStringToCents', () => {
    it('converte o formato da API do Mercado Bitcoin', () => {
      expect(decimalStringToCents('427253.00000000')).toBe(42725300);
      expect(decimalStringToCents('427253.12345678')).toBe(42725312);
    });

    it('arredonda pela terceira casa (meio para cima)', () => {
      expect(decimalStringToCents('10.005')).toBe(1001);
      expect(decimalStringToCents('10.004')).toBe(1000);
      expect(decimalStringToCents('99.999')).toBe(10000);
    });

    it('aceita inteiros e rejeita textos inválidos', () => {
      expect(decimalStringToCents('500000')).toBe(50000000);
      expect(() => decimalStringToCents('abc')).toThrow(RangeError);
      expect(() => decimalStringToCents('-1.00')).toThrow(RangeError);
    });
  });

  describe('centsToSats', () => {
    // Exemplo do PRD: BTC a R$ 400.000 → R$ 800 compra 0,002 BTC.
    it('calcula quantos satoshis um valor compra', () => {
      expect(centsToSats(80000, 40000000)).toBe(200000);
    });

    it('arredonda para baixo por padrão (nunca entrega BTC a mais)', () => {
      // R$ 100 a R$ 300.000 = 33333,33... sats
      expect(centsToSats(10000, 30000000)).toBe(33333);
    });

    it('arredonda para cima quando pedido (venda precisa cobrir o valor)', () => {
      expect(centsToSats(10000, 30000000, 'ceil')).toBe(33334);
      expect(centsToSats(60000, 50000000, 'ceil')).toBe(120000); // divisão exata não muda
    });

    it('não perde precisão com valores grandes (BigInt)', () => {
      // R$ 1.000.000,00 a R$ 427.253,00: 100.000.000 × 10^8 passaria do limite seguro de Number
      expect(centsToSats(100000000, 42725300)).toBe(234053359);
    });

    it('rejeita preço zero e valores não inteiros', () => {
      expect(() => centsToSats(100, 0)).toThrow(RangeError);
      expect(() => centsToSats(10.5, 100)).toThrow(RangeError);
      expect(() => centsToSats(-1, 100)).toThrow(RangeError);
    });
  });

  describe('satsToCents', () => {
    it('calcula quanto valem satoshis a um preço', () => {
      // 0,002 BTC a R$ 500.000 = R$ 1.000
      expect(satsToCents(200000, 50000000)).toBe(100000);
    });

    it('arredonda para baixo', () => {
      // 1 sat a R$ 427.253,00 = 0,427 centavo
      expect(satsToCents(1, 42725300)).toBe(0);
    });
  });

  it('satsToBtc converte para decimal', () => {
    expect(satsToBtc(120000)).toBe(0.0012);
  });
});
