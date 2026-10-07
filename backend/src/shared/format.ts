import { SATS_PER_BTC } from './money.js';

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const NON_BREAKING_SPACE = String.fromCharCode(160);
const btcFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 8,
  maximumFractionDigits: 8,
});

/** 8750 → "R$ 87,50" (textos para pessoas: e-mails). */
export function formatBRL(cents: number): string {
  // O Intl usa espaço não separável depois do "R$"; trocamos por espaço comum para e-mails de texto.
  return brlFormatter.format(cents / 100).replaceAll(NON_BREAKING_SPACE, ' ');
}

/** 120000 → "0,00120000 BTC" */
export function formatBTC(sats: number): string {
  return `${btcFormatter.format(sats / SATS_PER_BTC)} BTC`;
}
