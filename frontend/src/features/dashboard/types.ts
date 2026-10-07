/** Formatos das respostas da API (ver backend/docs/openapi.yaml). */

export interface Balance {
  balance: number;
}

export interface Quote {
  buy: number;
  sell: number;
  updatedAt: string;
}

export interface Volume {
  date: string;
  bought: number;
  sold: number;
}

export interface PositionItem {
  id: string;
  purchasedAt: string;
  investedAmount: number;
  btcAmount: number;
  btcPriceAtPurchase: number;
  priceVariationPercent: number;
  currentValue: number;
  origin: 'PURCHASE' | 'REINVESTMENT';
}

export interface Position {
  summary: {
    invested: number;
    btcAmount: number;
    currentValue: number;
    returnPercent: number;
    currentBtcPrice: number | null;
  };
  investments: PositionItem[];
}

export interface HistoryPoint {
  timestamp: string;
  buy: number;
  sell: number;
  source: 'TICKER' | 'BACKFILL';
}
