/**
 * Dinheiro no front segue a mesma regra da API: contas só com inteiros, em centavos (R$) e
 * satoshis (BTC). A API recebe e devolve decimais (R$ com 2 casas); a conversão fica nas bordas.
 */

const SATS_PER_BTC = 100_000_000;

/** Campo "estilo app de banco" aceita até 11 dígitos: R$ 999.999.999,99. */
export const MONEY_INPUT_MAX_DIGITS = 11;

/** R$ vindo da API → centavos (418282.5 → 41828250). */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Centavos → R$ para enviar à API (12345 → 123.45). */
export function toReais(cents: number): number {
  return cents / 100;
}

/** Satoshis → BTC, só para exibir (358609 → 0.00358609). */
export function satsToBtc(sats: number): number {
  return sats / SATS_PER_BTC;
}

/** BTC vindo da API → satoshis (0.00358609 → 358609). */
export function btcToSats(btc: number): number {
  return Math.round(btc * SATS_PER_BTC);
}

/**
 * Quantos satoshis um valor compra, igual à API. `floor` (padrão, compra): o cliente nunca
 * recebe mais BTC do que pagou. `ceil` (venda): os sats vendidos cobrem o valor pedido.
 * BigInt evita perder precisão em `centavos × 100.000.000`.
 */
export function centsToSats(
  cents: number,
  priceCents: number,
  rounding: 'floor' | 'ceil' = 'floor',
): number {
  if (cents <= 0 || priceCents <= 0) return 0;
  const numerator = BigInt(cents) * BigInt(SATS_PER_BTC);
  const denominator = BigInt(priceCents);
  const sats = numerator / denominator; // divisão de BigInt já arredonda para baixo
  const roundUp = rounding === 'ceil' && numerator % denominator !== BigInt(0);
  return Number(roundUp ? sats + BigInt(1) : sats);
}

/** Quanto valem os satoshis numa cotação, arredondado para baixo no centavo (igual à API). */
export function satsToCents(sats: number, priceCents: number): number {
  if (sats <= 0 || priceCents <= 0) return 0;
  return Number((BigInt(sats) * BigInt(priceCents)) / BigInt(SATS_PER_BTC));
}

/**
 * Lê o texto do campo de R$ "estilo app de banco": os dígitos entram pelos centavos
 * ("R$ 0,001" → 1; "R$ 1.234,567" → 123457). Devolve null se passar do limite de dígitos
 * (o campo então ignora a tecla).
 */
export function parseMoneyInput(text: string): number | null {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length > MONEY_INPUT_MAX_DIGITS) return null;
  return digits === '' ? 0 : Number(digits);
}
