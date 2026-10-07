import type { Quote, QuoteProvider } from './quote.provider.js';

/**
 * Cotação com cache em memória.
 * - Dentro do TTL (padrão 10 s), devolve a mesma cotação sem chamar o Mercado Bitcoin.
 * - Várias requisições ao mesmo tempo com o cache vencido compartilham UMA chamada externa.
 * - Erros não ficam em cache: a próxima requisição tenta de novo.
 */
export class QuoteService {
  private cached?: { quote: Quote; storedAt: number };
  private inFlight?: Promise<Quote>;

  constructor(
    private readonly provider: QuoteProvider,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async getCurrent(): Promise<Quote> {
    // A idade do cache é medida sempre pelo MESMO relógio (o do service).
    if (this.cached && this.now() - this.cached.storedAt < this.ttlMs) {
      return this.cached.quote;
    }

    this.inFlight ??= this.provider
      .fetchQuote()
      .then((quote) => {
        this.cached = { quote, storedAt: this.now() };
        return quote;
      })
      .finally(() => {
        this.inFlight = undefined;
      });

    return this.inFlight;
  }
}
