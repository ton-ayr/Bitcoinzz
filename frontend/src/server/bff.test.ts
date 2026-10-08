import { describe, expect, it, vi } from 'vitest';
import { forwardToApi, isAllowedRoute, isSameOrigin, sessionMaxAge } from './bff';

describe('isAllowedRoute (allowlist do BFF)', () => {
  it.each([
    ['GET', 'account'],
    ['GET', 'account/balance'],
    ['POST', 'account/deposit'],
    ['GET', 'btc'],
    ['GET', 'btc/price'],
    ['POST', 'btc/purchase'],
    ['POST', 'btc/sell'],
    ['GET', 'extract'],
    ['GET', 'volume'],
    ['GET', 'history'],
  ])('permite %s %s', (method, path) => {
    expect(isAllowedRoute(method, path)).toBe(true);
  });

  it.each([
    ['POST', 'account'], // cadastro só pelo /api/auth/register
    ['POST', 'login'], // login só pelo /api/auth/login
    ['GET', 'btc/purchase'], // método errado
    ['DELETE', 'account'],
    ['GET', 'health'],
    ['GET', 'docs'],
    ['GET', 'account/../login'],
  ])('bloqueia %s %s', (method, path) => {
    expect(isAllowedRoute(method, path)).toBe(false);
  });
});

describe('forwardToApi', () => {
  const okFetch = () =>
    vi.fn(async () => Response.json({ balance: 87.5 }, { status: 200 })) as unknown as typeof fetch;

  it('repassa para a API com o Bearer do cookie e devolve status e corpo', async () => {
    const fetchFn = okFetch();
    const response = await forwardToApi({
      apiUrl: 'http://api.local/',
      method: 'GET',
      path: 'account/balance',
      token: 'jwt-123',
      fetchFn,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ balance: 87.5 });
    const [url, init] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe('http://api.local/account/balance');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer jwt-123');
    expect((init.headers as Headers).get('Content-Type')).toBeNull(); // GET sem corpo
  });

  it('mantém a query string e envia JSON nos POSTs', async () => {
    const fetchFn = okFetch();
    await forwardToApi({
      apiUrl: 'http://api.local',
      method: 'GET',
      path: 'extract',
      search: 'from=2026-09-01',
      fetchFn,
    });
    await forwardToApi({
      apiUrl: 'http://api.local',
      method: 'POST',
      path: 'btc/purchase',
      body: '{"amount":25}',
      fetchFn,
    });

    const calls = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0]![0]).toBe('http://api.local/extract?from=2026-09-01');
    expect(calls[1]![1]).toMatchObject({ method: 'POST', body: '{"amount":25}' });
    expect((calls[1]![1].headers as Headers).get('Content-Type')).toBe('application/json');
  });

  it('erros da API passam como vieram (ex.: 422 com a mensagem)', async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({ statusCode: 422, message: 'Saldo insuficiente.' }, { status: 422 }),
    ) as unknown as typeof fetch;
    const response = await forwardToApi({
      apiUrl: 'http://x',
      method: 'GET',
      path: 'btc',
      fetchFn,
    });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ statusCode: 422, message: 'Saldo insuficiente.' });
  });

  it('API demorando demais → 504; API fora do ar → 503', async () => {
    const timeout = vi.fn(async () => {
      throw new DOMException('timeout', 'TimeoutError');
    }) as unknown as typeof fetch;
    const down = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;

    const slow = await forwardToApi({
      apiUrl: 'http://x',
      method: 'GET',
      path: 'btc',
      fetchFn: timeout,
    });
    const off = await forwardToApi({
      apiUrl: 'http://x',
      method: 'GET',
      path: 'btc',
      fetchFn: down,
    });

    expect(slow.status).toBe(504);
    expect(off.status).toBe(503);
    expect((await off.json()).message).toMatch(/indisponível/);
  });
});

describe('sessionMaxAge (cookie expira junto com o JWT)', () => {
  const tokenWithExp = (exp: number) =>
    `header.${Buffer.from(JSON.stringify({ sub: 'u1', exp })).toString('base64url')}.assinatura`;
  const now = Date.UTC(2026, 9, 7, 12, 0, 0);
  const nowSeconds = now / 1000;

  it('usa o tempo restante do token', () => {
    expect(sessionMaxAge(tokenWithExp(nowSeconds + 8 * 3600), now)).toBe(8 * 3600);
  });

  it('token já expirado → 0 (o cookie nem fica salvo)', () => {
    expect(sessionMaxAge(tokenWithExp(nowSeconds - 10), now)).toBe(0);
  });

  it('formato inesperado → 8 h (padrão da API)', () => {
    expect(sessionMaxAge('nao-e-jwt', now)).toBe(8 * 3600);
  });
});

describe('isSameOrigin (defesa contra CSRF)', () => {
  const post = (origin?: string) =>
    new Request('https://bitcoinzz.vercel.app/api/btc/purchase', {
      method: 'POST',
      headers: origin ? { origin } : {},
    });

  it('aceita o próprio site e chamadas sem Origin', () => {
    expect(isSameOrigin(post('https://bitcoinzz.vercel.app'))).toBe(true);
    expect(isSameOrigin(post())).toBe(true);
  });

  it('recusa outro site e Origin inválido', () => {
    expect(isSameOrigin(post('https://site-malicioso.com'))).toBe(false);
    expect(isSameOrigin(post('lixo'))).toBe(false);
  });

  // Bug achado no Docker: com HOSTNAME=0.0.0.0, a URL interna é http://0.0.0.0:3000, mas o
  // navegador acessou http://localhost:3000 (cabeçalho Host). Vale o host que o navegador usou.
  const container = (origin: string, headers: Record<string, string>) =>
    new Request('http://0.0.0.0:3000/api/auth/login', {
      method: 'POST',
      headers: { origin, ...headers },
    });

  it('compara com o host que o navegador acessou (Host ou X-Forwarded-Host)', () => {
    expect(isSameOrigin(container('http://localhost:3000', { host: 'localhost:3000' }))).toBe(true);
    expect(
      isSameOrigin(
        container('https://app.exemplo.com', {
          host: '10.0.0.5:3000',
          'x-forwarded-host': 'app.exemplo.com, proxy.interno',
        }),
      ),
    ).toBe(true);
    expect(isSameOrigin(container('https://site-malicioso.com', { host: 'localhost:3000' }))).toBe(
      false,
    );
  });
});
