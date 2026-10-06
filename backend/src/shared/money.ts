/**
 * Dinheiro é sempre guardado em inteiros para evitar erros de ponto flutuante
 * (em JavaScript, 0.1 + 0.2 === 0.30000000000000004):
 *   - R$  → centavos   (R$ 10,50 = 1050)
 *   - BTC → satoshis   (1 BTC = 100.000.000 sats)
 * Contas que envolvem preço usam BigInt, para multiplicar números grandes sem perder precisão.
 */

export const SATS_PER_BTC = 100_000_000;
const SATS_PER_BTC_BIG = BigInt(SATS_PER_BTC);

export type Rounding = 'floor' | 'ceil';

function assertInteger(value: number, name: string, { positive = false } = {}): void {
  if (!Number.isSafeInteger(value) || value < 0 || (positive && value === 0)) {
    throw new RangeError(`${name} deve ser um inteiro ${positive ? 'positivo' : 'não negativo'}`);
  }
}

function toSafeNumber(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) {
    throw new RangeError('Valor fora do limite seguro de inteiros');
  }
  return result;
}

/** R$ (decimal) → centavos. Ex.: 87.5 → 8750 */
export function reaisToCents(reais: number): number {
  if (!Number.isFinite(reais)) {
    throw new RangeError('Valor em reais inválido');
  }
  return Math.round(reais * 100);
}

/** Centavos → R$ (decimal). Ex.: 8750 → 87.5 */
export function centsToReais(cents: number): number {
  return cents / 100;
}

/** Satoshis → BTC (decimal). Ex.: 120000 → 0.0012 */
export function satsToBtc(sats: number): number {
  return sats / SATS_PER_BTC;
}

/** true se o número tiver no máximo 2 casas decimais (ex.: 10.5 sim, 10.505 não). */
export function hasAtMostTwoDecimals(value: number): boolean {
  const scaled = value * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

/**
 * Converte um decimal em texto (como vem da API do Mercado Bitcoin, ex.: "427253.12345678")
 * para centavos, sem passar por ponto flutuante. Arredonda pela terceira casa (meio para cima).
 */
export function decimalStringToCents(value: string): number {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) {
    throw new RangeError(`Decimal inválido: "${value}"`);
  }

  const [, integerPart, fractionPart = ''] = match;
  const fraction = fractionPart.padEnd(3, '0');
  let cents = BigInt(integerPart) * 100n + BigInt(fraction.slice(0, 2));
  if (Number(fraction[2]) >= 5) {
    cents += 1n;
  }
  return toSafeNumber(cents);
}

/**
 * Quantos satoshis um valor em centavos compra a um preço (centavos por 1 BTC).
 * `floor` (padrão) nunca entrega mais BTC do que o valor paga;
 * `ceil` garante que os sats vendidos cubram o valor pedido.
 */
export function centsToSats(
  cents: number,
  priceCents: number,
  rounding: Rounding = 'floor',
): number {
  assertInteger(cents, 'cents');
  assertInteger(priceCents, 'priceCents', { positive: true });

  const numerator = BigInt(cents) * SATS_PER_BTC_BIG;
  const denominator = BigInt(priceCents);
  let sats = numerator / denominator; // divisão de BigInt já arredonda para baixo
  if (rounding === 'ceil' && numerator % denominator !== 0n) {
    sats += 1n;
  }
  return toSafeNumber(sats);
}

/** Quanto vale (em centavos, arredondado para baixo) uma quantidade de satoshis a um preço. */
export function satsToCents(sats: number, priceCents: number): number {
  assertInteger(sats, 'sats');
  assertInteger(priceCents, 'priceCents', { positive: true });

  return toSafeNumber((BigInt(sats) * BigInt(priceCents)) / SATS_PER_BTC_BIG);
}
