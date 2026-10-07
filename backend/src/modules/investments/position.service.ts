import { satsToCents } from '../../shared/money.js';
import type { QuoteService } from '../quotes/quote.service.js';
import type { InvestmentRepository } from './investment.repository.js';

export interface PositionItem {
  id: string;
  purchasedAt: Date;
  investedCents: number;
  btcSats: number;
  /** Cotação do BTC no momento da compra. */
  purchasePriceCents: number;
  /** Variação % do preço do BTC desde a compra. */
  priceVariationPercent: number;
  /** Valor bruto atual: quanto o cliente receberia vendendo agora. */
  currentValueCents: number;
  origin: 'PURCHASE' | 'REINVESTMENT';
}

export interface Position {
  summary: {
    investedCents: number;
    btcSats: number;
    currentValueCents: number;
    /** Resultado % da carteira inteira: (valor atual − investido) / investido. */
    returnPercent: number;
    /** Cotação de compra usada no cálculo (null se não há investimentos). */
    currentBtcPriceCents: number | null;
  };
  investments: PositionItem[];
}

/** Percentual com 2 casas decimais (ex.: 25.5 = 25,5%). */
function percent(part: number, whole: number): number {
  if (whole === 0) return 0;
  // `+ 0` transforma −0 em 0 (ex.: −0,0002% arredondado), para nunca exibir "-0%".
  return Math.round((part / whole) * 10_000) / 100 + 0;
}

export class PositionService {
  constructor(
    private readonly investments: InvestmentRepository,
    private readonly quotes: QuoteService,
  ) {}

  async getPosition(userId: string): Promise<Position> {
    const open = await this.investments.findOpenByUser(userId);

    // Sem investimentos, não depende da cotação (funciona mesmo com o Mercado Bitcoin fora).
    if (open.length === 0) {
      return {
        summary: {
          investedCents: 0,
          btcSats: 0,
          currentValueCents: 0,
          returnPercent: 0,
          currentBtcPriceCents: null,
        },
        investments: [],
      };
    }

    // Valor atual pela cotação de COMPRA: é o preço que o mercado paga se o cliente vender agora.
    const { buyCents } = await this.quotes.getCurrent();

    const items = open.map<PositionItem>((investment) => ({
      id: investment.id,
      purchasedAt: investment.purchasedAt,
      investedCents: investment.investedCents,
      btcSats: investment.btcSats,
      purchasePriceCents: investment.purchasePriceCents,
      priceVariationPercent: percent(
        buyCents - investment.purchasePriceCents,
        investment.purchasePriceCents,
      ),
      currentValueCents: satsToCents(investment.btcSats, buyCents),
      origin: investment.origin,
    }));

    const investedCents = items.reduce((total, item) => total + item.investedCents, 0);
    const currentValueCents = items.reduce((total, item) => total + item.currentValueCents, 0);

    return {
      summary: {
        investedCents,
        btcSats: items.reduce((total, item) => total + item.btcSats, 0),
        currentValueCents,
        returnPercent: percent(currentValueCents - investedCents, investedCents),
        currentBtcPriceCents: buyCents,
      },
      investments: items,
    };
  }
}
