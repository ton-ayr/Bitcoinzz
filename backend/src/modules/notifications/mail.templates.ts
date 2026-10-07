import { formatBRL, formatBTC } from '../../shared/format.js';
import type { MailMessage } from './mailer.js';

type EmailContent = Omit<MailMessage, 'to'>;

/** Evita que um nome como "<script>" vire HTML de verdade dentro do e-mail. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Layout simples e compatível com clientes de e-mail (tabela + estilos inline). */
function layout(title: string, paragraphs: string[]): string {
  const body = paragraphs
    .map((paragraph) => `<p style="margin:0 0 12px;line-height:1.5">${paragraph}</p>`)
    .join('');

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#0E0F13;font-family:Arial,sans-serif;color:#F2F3F5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#16171D;border:1px solid #2A2B36;border-radius:12px">
<tr><td style="padding:24px 28px;border-bottom:3px solid #5865F2"><strong style="font-size:20px;color:#7983F5">Bitcoinzz</strong></td></tr>
<tr><td style="padding:24px 28px"><h1 style="margin:0 0 16px;font-size:18px">${title}</h1>${body}</td></tr>
<tr><td style="padding:16px 28px;font-size:12px;color:#A3A6B4">Plataforma simulada de investimentos. Nenhum valor real foi movimentado.</td></tr>
</table></td></tr></table></body></html>`;
}

export function depositEmail(
  name: string,
  amountCents: number,
  balanceCents: number,
): EmailContent {
  const amount = formatBRL(amountCents);
  const balance = formatBRL(balanceCents);

  return {
    subject: `Depósito de ${amount} confirmado`,
    text: `Olá, ${name}!\n\nSeu depósito de ${amount} foi confirmado.\nSaldo disponível: ${balance}.\n\nBitcoinzz`,
    html: layout('Depósito confirmado', [
      `Olá, ${escapeHtml(name)}!`,
      `Seu depósito de <strong>${amount}</strong> foi confirmado.`,
      `Saldo disponível: <strong>${balance}</strong>.`,
    ]),
  };
}

export function purchaseEmail(
  name: string,
  amountCents: number,
  btcSats: number,
  priceCents: number,
): EmailContent {
  const amount = formatBRL(amountCents);
  const btc = formatBTC(btcSats);
  const price = formatBRL(priceCents);

  return {
    subject: `Compra de ${btc} confirmada`,
    text: `Olá, ${name}!

Você investiu ${amount} e comprou ${btc}.
Cotação utilizada: ${price} por BTC.

Bitcoinzz`,
    html: layout('Compra de bitcoin confirmada', [
      `Olá, ${escapeHtml(name)}!`,
      `Você investiu <strong>${amount}</strong> e comprou <strong>${btc}</strong>.`,
      `Cotação utilizada: ${price} por BTC.`,
    ]),
  };
}

export function saleEmail(name: string, amountCents: number, btcSats: number): EmailContent {
  const amount = formatBRL(amountCents);
  const btc = formatBTC(btcSats);

  return {
    subject: `Venda de ${btc} confirmada`,
    text: `Olá, ${name}!

Você vendeu ${btc} e resgatou ${amount}.
O valor já está disponível no seu saldo.

Bitcoinzz`,
    html: layout('Venda de bitcoin confirmada', [
      `Olá, ${escapeHtml(name)}!`,
      `Você vendeu <strong>${btc}</strong> e resgatou <strong>${amount}</strong>.`,
      'O valor já está disponível no seu saldo.',
    ]),
  };
}
