import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serverWake, SLOW_AFTER_MS } from './server-wake';

/** Promessa que o teste resolve quando quiser (simula uma requisição em andamento). */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
}

describe('serverWake (aviso "Acordando o servidor…")', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    serverWake.reset();
  });
  afterEach(() => vi.useRealTimers());

  it('requisição rápida nunca mostra o aviso', async () => {
    await serverWake.track(Promise.resolve('ok'));
    vi.advanceTimersByTime(SLOW_AFTER_MS * 2);
    expect(serverWake.isSlow()).toBe(false);
  });

  it(`requisição lenta mostra o aviso após ${SLOW_AFTER_MS} ms e esconde quando termina`, async () => {
    const listener = vi.fn();
    serverWake.subscribe(listener);
    const request = deferred();
    const tracked = serverWake.track(request.promise);

    vi.advanceTimersByTime(SLOW_AFTER_MS - 1);
    expect(serverWake.isSlow()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(serverWake.isSlow()).toBe(true);

    request.resolve();
    await tracked;
    expect(serverWake.isSlow()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2); // ligou e desligou
  });

  it('com várias requisições, só esconde quando TODAS terminam', async () => {
    const first = deferred();
    const second = deferred();
    const a = serverWake.track(first.promise);
    const b = serverWake.track(second.promise);
    vi.advanceTimersByTime(SLOW_AFTER_MS);

    first.resolve();
    await a;
    expect(serverWake.isSlow()).toBe(true);

    second.resolve();
    await b;
    expect(serverWake.isSlow()).toBe(false);
  });

  it('erro na requisição também libera o aviso', async () => {
    const tracked = serverWake.track(Promise.reject(new Error('falhou')));
    await expect(tracked).rejects.toThrow('falhou');
    expect(serverWake.isSlow()).toBe(false);
  });
});
