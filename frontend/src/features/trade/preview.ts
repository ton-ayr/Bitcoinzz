import { formatBRL } from '@/lib/format';
import { centsToSats, toReais } from '@/lib/money';

/** Mesmo limite da API (backend: `MAX_DEPOSIT_REAIS`): R$ 1.000.000,00 por depósito. */
export const MAX_DEPOSIT_CENTS = 100_000_000;

export interface DepositPreview {
  balanceAfterCents: number;
  /** Mensagem para o usuário, ou null se o depósito pode seguir. */
  error: string | null;
}

/** Prévia do depósito: saldo depois e validação do valor (mesmas regras e mensagens da API). */
export function depositPreview(amountCents: number, balanceCents: number): DepositPreview {
  let error: string | null = null;
  if (amountCents <= 0) {
    error = 'Informe o valor do depósito';
  } else if (amountCents > MAX_DEPOSIT_CENTS) {
    error = `O valor máximo por depósito é ${formatBRL(toReais(MAX_DEPOSIT_CENTS))}`;
  }
  return { balanceAfterCents: balanceCents + amountCents, error };
}

export interface PurchasePreview {
  /** BTC estimado em satoshis; null enquanto a cotação não chegou. */
  btcSats: number | null;
  balanceAfterCents: number;
  error: string | null;
}

/**
 * Prévia da compra, com as mesmas regras da API: converte pela cotação de VENDA, arredonda o
 * BTC para baixo e recusa valor acima do saldo ou que não compra nem 1 satoshi.
 * É uma estimativa: a API usa a cotação do momento em que a compra é confirmada.
 */
export function purchasePreview({
  amountCents,
  balanceCents,
  priceCents,
}: {
  amountCents: number;
  balanceCents: number;
  priceCents: number | null;
}): PurchasePreview {
  const btcSats = priceCents === null ? null : centsToSats(amountCents, priceCents);

  let error: string | null = null;
  if (amountCents <= 0) {
    error = 'Informe o valor da compra';
  } else if (amountCents > balanceCents) {
    error = `Saldo insuficiente. Disponível: ${formatBRL(toReais(balanceCents))}.`;
  } else if (btcSats === 0) {
    error = 'Valor muito baixo: não compra nem 1 satoshi (0,00000001 BTC) na cotação atual.';
  }

  return { btcSats, balanceAfterCents: balanceCents - amountCents, error };
}

/** Atalhos "25%", "50%" e "Tudo" do saldo, arredondados para baixo no centavo. */
export function percentOf(cents: number, percent: number): number {
  return Math.floor((cents * percent) / 100);
}
