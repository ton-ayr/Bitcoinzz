import type { PositionItem } from '@/features/dashboard/types';
import { formatBRL } from '@/lib/format';
import { btcToSats, centsToSats, satsToCents, toCents, toReais } from '@/lib/money';

/** Investimento aberto em inteiros, na ordem FIFO em que a API devolve a posição. */
export interface OpenInvestment {
  id: string;
  purchasedAt: string;
  btcSats: number;
  investedCents: number;
  purchasePriceCents: number;
}

export function toOpenInvestments(items: PositionItem[]): OpenInvestment[] {
  return items.map((item) => ({
    id: item.id,
    purchasedAt: item.purchasedAt,
    btcSats: btcToSats(item.btcAmount),
    investedCents: toCents(item.investedAmount),
    purchasePriceCents: toCents(item.btcPriceAtPurchase),
  }));
}

/** O que a venda faz com cada investimento: vende inteiro, vende em parte ou não mexe. */
export interface SaleStep {
  investment: OpenInvestment;
  kind: 'SOLD' | 'PARTIAL' | 'KEPT';
  soldSats: number;
  /** BTC que sobra e vira reinvestimento (só na venda parcial). */
  leftoverSats: number;
}

export interface Reinvestment {
  btcSats: number;
  /** Cotação ORIGINAL do investimento vendido em parte. */
  priceCents: number;
  investedCents: number;
}

export interface SalePreview {
  /** Quanto a posição inteira vale agora: o máximo que dá para vender. */
  positionValueCents: number;
  soldSats: number;
  steps: SaleStep[];
  reinvestment: Reinvestment | null;
  error: string | null;
}

/**
 * Prévia da venda com as mesmas regras e mensagens da API (`SaleService.planSale`):
 * 1. Vende pela cotação de COMPRA, do investimento mais antigo para o mais novo (FIFO).
 * 2. O investimento atingido em parte vende só os sats necessários (arredondados para cima,
 *    para cobrir o valor); a sobra vira um reinvestimento com a mesma cotação e data.
 */
export function salePreview({
  amountCents,
  investments,
  priceCents,
}: {
  amountCents: number;
  investments: OpenInvestment[];
  priceCents: number;
}): SalePreview {
  const positionValueCents = investments.reduce(
    (total, investment) => total + satsToCents(investment.btcSats, priceCents),
    0,
  );

  let error: string | null = null;
  if (investments.length === 0) {
    error = 'Você não tem bitcoins para vender.';
  } else if (amountCents <= 0) {
    error = 'Informe o valor da venda';
  } else if (amountCents > positionValueCents) {
    error = `Valor maior que a sua posição. Máximo disponível para venda: ${formatBRL(toReais(positionValueCents))}.`;
  }

  const steps: SaleStep[] = [];
  let soldSats = 0;
  let reinvestment: Reinvestment | null = null;
  let remainingCents = error ? 0 : amountCents;

  for (const investment of investments) {
    if (remainingCents === 0) {
      steps.push({ investment, kind: 'KEPT', soldSats: 0, leftoverSats: 0 });
      continue;
    }

    const valueCents = satsToCents(investment.btcSats, priceCents);
    if (valueCents <= remainingCents) {
      // Cabe inteiro no valor pedido: vende todo o BTC deste investimento.
      steps.push({ investment, kind: 'SOLD', soldSats: investment.btcSats, leftoverSats: 0 });
      soldSats += investment.btcSats;
      remainingCents -= valueCents;
      continue;
    }

    // Parcial: vende só o necessário; se o arredondamento consumir tudo, não sobra nada.
    const sellSats = centsToSats(remainingCents, priceCents, 'ceil');
    const leftoverSats = investment.btcSats - sellSats;
    soldSats += sellSats;
    remainingCents = 0;
    if (leftoverSats > 0) {
      steps.push({ investment, kind: 'PARTIAL', soldSats: sellSats, leftoverSats });
      reinvestment = {
        btcSats: leftoverSats,
        priceCents: investment.purchasePriceCents,
        investedCents: satsToCents(leftoverSats, investment.purchasePriceCents),
      };
    } else {
      steps.push({ investment, kind: 'SOLD', soldSats: sellSats, leftoverSats: 0 });
    }
  }

  return { positionValueCents, soldSats, steps, reinvestment, error };
}
