import { describe, expect, it, vi } from 'vitest';
import {
  MercadoBitcoinClient,
  UNAVAILABLE_MESSAGE,
} from '../../src/modules/quotes/mercado-bitcoin.client.js';
import { ServiceUnavailableError } from '../../src/shared/errors/app-error.js';

const BASE_URL = 'https://api.mercadobitcoin.net/api/v4';
const FIXED_NOW = new Date('2026-10-06T12:00:00Z');

// Formato real da resposta (copiado de uma chamada ao endpoint v4 em 06/10/2026).
const realTicker = [
  {
    pair: 'BTC-BRL',
    high: '435194.00000000',
    low: '421740.00000000',
    vol: '22.24230907',
    last: '427174.00000000',
    buy: '427253.00000000',
    sell: '427254.00000000',
    open: '428961.00000000',
    date: 1791312161,
  },
];

function clientReturning(response: Response | Error) {
  const fetchFn = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  const client = new MercadoBitcoinClient({
    baseUrl: `${BASE_URL}/`,
    fetchFn: fetchFn as unknown as typeof fetch,
    now: () => FIXED_NOW,
  });
  return { client, fetchFn };
}

describe('MercadoBitcoinClient', () => {
  it('chama o endpoint v4 documentado e converte os preços para centavos', async () => {
    const { client, fetchFn } = clientReturning(Response.json(realTicker));

    const quote = await client.fetchQuote();

    expect(fetchFn).toHaveBeenCalledWith(`${BASE_URL}/tickers?symbols=BTC-BRL`, expect.anything());
    expect(quote).toEqual({ buyCents: 42725300, sellCents: 42725400, fetchedAt: FIXED_NOW });
  });

  it.each([
    ['HTTP 500', () => new Response('erro', { status: 500 })],
    ['HTTP 429 (limite de requisições deles)', () => new Response('', { status: 429 })],
    ['corpo que não é JSON', () => new Response('<html>manutenção</html>')],
    ['lista vazia', () => Response.json([])],
    ['outro par', () => Response.json([{ ...realTicker[0], pair: 'ETH-BRL' }])],
    ['preço fora do formato', () => Response.json([{ ...realTicker[0], buy: 'abc' }])],
    ['preço zero', () => Response.json([{ ...realTicker[0], sell: '0.00000000' }])],
  ])('%s → 503 com mensagem amigável', async (_case, makeResponse) => {
    const { client } = clientReturning(makeResponse());
    const error = await client.fetchQuote().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect(error).toMatchObject({ statusCode: 503, message: UNAVAILABLE_MESSAGE });
  });

  it('falha de rede ou timeout → 503, guardando a causa original para o log', async () => {
    const networkError = new TypeError('fetch failed');
    const { client } = clientReturning(networkError);

    const error = await client.fetchQuote().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect((error as Error).cause).toBe(networkError);
  });

  describe('fetchMinuteCandles', () => {
    const from = new Date('2026-10-06T09:00:00Z');
    const to = new Date('2026-10-06T12:00:00Z');

    it('pede candles de 1 minuto no período e converte o fechamento para centavos', async () => {
      const { client, fetchFn } = clientReturning(
        Response.json({
          t: [1791306000, 1791306060],
          o: ['427000.00000000', '427100.00000000'],
          h: ['427200.00000000', '427300.00000000'],
          l: ['426900.00000000', '427000.00000000'],
          c: ['427253.00000000', '427260.50000000'],
          v: ['0.1', '0.2'],
        }),
      );

      const candles = await client.fetchMinuteCandles(from, to);

      expect(fetchFn).toHaveBeenCalledWith(
        `${BASE_URL}/candles?symbol=BTC-BRL&resolution=1m&from=1791277200&to=1791288000`,
        expect.anything(),
      );
      expect(candles).toEqual([
        { time: new Date(1791306000 * 1000), closeCents: 42725300 },
        { time: new Date(1791306060 * 1000), closeCents: 42726050 },
      ]);
    });

    it('arrays desalinhados ou formato inesperado → 503', async () => {
      const { client } = clientReturning(Response.json({ t: [1, 2], c: ['1.00'] }));
      await expect(client.fetchMinuteCandles(from, to)).rejects.toBeInstanceOf(
        ServiceUnavailableError,
      );
    });
  });
});
