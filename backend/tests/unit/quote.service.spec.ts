import { beforeEach, describe, expect, it } from 'vitest';
import { QuoteService } from '../../src/modules/quotes/quote.service.js';
import { ServiceUnavailableError } from '../../src/shared/errors/app-error.js';
import { FakeQuoteProvider } from '../helpers/fakes.js';

describe('QuoteService (cache de 10 s)', () => {
  let provider: FakeQuoteProvider;
  let clock: number;
  let service: QuoteService;

  beforeEach(() => {
    provider = new FakeQuoteProvider();
    clock = Date.now();
    service = new QuoteService(provider, 10_000, () => clock);
  });

  it('dentro de 10 s, reaproveita a cotação sem chamar o Mercado Bitcoin', async () => {
    const first = await service.getCurrent();
    clock += 9_999;
    const second = await service.getCurrent();

    expect(second).toBe(first);
    expect(provider.calls).toBe(1);
  });

  it('depois de 10 s, busca uma cotação nova', async () => {
    await service.getCurrent();
    clock += 10_000;
    provider.buyCents = 50000000;

    const fresh = await service.getCurrent();

    expect(provider.calls).toBe(2);
    expect(fresh.buyCents).toBe(50000000);
  });

  it('várias requisições ao mesmo tempo fazem UMA chamada externa', async () => {
    const results = await Promise.all([
      service.getCurrent(),
      service.getCurrent(),
      service.getCurrent(),
    ]);

    expect(provider.calls).toBe(1);
    expect(new Set(results).size).toBe(1);
  });

  it('erro não fica em cache: a próxima requisição tenta de novo', async () => {
    provider.failure = new ServiceUnavailableError('fora do ar');
    await expect(service.getCurrent()).rejects.toBeInstanceOf(ServiceUnavailableError);

    provider.failure = undefined;
    await expect(service.getCurrent()).resolves.toMatchObject({ buyCents: 42725300 });
    expect(provider.calls).toBe(2);
  });
});
