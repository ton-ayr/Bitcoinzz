import { z } from 'zod';
import { ServiceUnavailableError } from '../../shared/errors/app-error.js';
import { decimalStringToCents } from '../../shared/money.js';
import type { CandleProvider, MinuteCandle, Quote, QuoteProvider } from './quote.provider.js';

const decimalString = z.string().regex(/^\d+(\.\d+)?$/);

// Resposta documentada de GET /tickers?symbols=BTC-BRL (API v4): uma lista, com preços em texto.
// Validar dados externos evita que uma mudança do lado deles vire um cálculo errado do nosso.
const tickersResponseSchema = z
  .array(z.object({ pair: z.literal('BTC-BRL'), buy: decimalString, sell: decimalString }))
  .min(1);

// Resposta documentada de GET /candles: arrays paralelos (t = início do minuto em segundos UTC,
// c = preço de fechamento). Só existem candles nos minutos em que houve negociação.
const candlesResponseSchema = z
  .object({ t: z.array(z.number().int()), c: z.array(decimalString) })
  .refine((candles) => candles.t.length === candles.c.length, 'Arrays de candles desalinhados');

export const UNAVAILABLE_MESSAGE =
  'Cotação do bitcoin indisponível no momento. Tente novamente em instantes.';

export interface MercadoBitcoinClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  /** Injetável para os testes não dependerem da internet. */
  fetchFn?: typeof fetch;
  now?: () => Date;
}

export class MercadoBitcoinClient implements QuoteProvider, CandleProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly now: () => Date;

  constructor(options: MercadoBitcoinClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.fetchFn = options.fetchFn ?? fetch;
    this.now = options.now ?? (() => new Date());
  }

  async fetchQuote(): Promise<Quote> {
    const payload = await this.getJson('/tickers?symbols=BTC-BRL');

    const parsed = tickersResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ServiceUnavailableError(UNAVAILABLE_MESSAGE, { cause: parsed.error });
    }

    const [ticker] = parsed.data;
    const buyCents = decimalStringToCents(ticker!.buy);
    const sellCents = decimalStringToCents(ticker!.sell);
    if (buyCents <= 0 || sellCents <= 0) {
      throw new ServiceUnavailableError(UNAVAILABLE_MESSAGE);
    }

    return { buyCents, sellCents, fetchedAt: this.now() };
  }

  async fetchMinuteCandles(from: Date, to: Date): Promise<MinuteCandle[]> {
    const toUnix = (date: Date) => Math.floor(date.getTime() / 1000);
    const payload = await this.getJson(
      `/candles?symbol=BTC-BRL&resolution=1m&from=${toUnix(from)}&to=${toUnix(to)}`,
    );

    const parsed = candlesResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ServiceUnavailableError(UNAVAILABLE_MESSAGE, { cause: parsed.error });
    }

    return parsed.data.t.map((seconds, index) => ({
      time: new Date(seconds * 1000),
      closeCents: decimalStringToCents(parsed.data.c[index]!),
    }));
  }

  /** GET na API do Mercado Bitcoin. Qualquer falha de rede/HTTP/JSON vira 503. */
  private async getJson(path: string): Promise<unknown> {
    try {
      const response = await this.fetchFn(`${this.baseUrl}${path}`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`Mercado Bitcoin respondeu HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Rede fora, timeout, HTTP de erro ou corpo que não é JSON.
      throw new ServiceUnavailableError(UNAVAILABLE_MESSAGE, { cause: error });
    }
  }
}
