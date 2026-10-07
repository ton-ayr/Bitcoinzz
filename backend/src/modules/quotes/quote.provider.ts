/** Cotação do BTC em centavos de real. */
export interface Quote {
  /** Quanto o mercado PAGA por 1 BTC: usado quando o cliente VENDE. */
  buyCents: number;
  /** Quanto o mercado COBRA por 1 BTC: usado quando o cliente COMPRA. */
  sellCents: number;
  /** Momento em que a cotação foi obtida. */
  fetchedAt: Date;
}

/** De onde vem a cotação. Hoje: Mercado Bitcoin. Nos testes: um fake com preço fixo. */
export interface QuoteProvider {
  fetchQuote(): Promise<Quote>;
}

/** Candle de 1 minuto: preço de fechamento (última negociação) daquele minuto. */
export interface MinuteCandle {
  time: Date;
  closeCents: number;
}

/** Histórico de preços negociados, usado para preencher lacunas do histórico de 10 em 10 min. */
export interface CandleProvider {
  fetchMinuteCandles(from: Date, to: Date): Promise<MinuteCandle[]>;
}
