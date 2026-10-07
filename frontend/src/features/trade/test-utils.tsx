import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

/** Utilitários dos testes das telas de operação (não entram no bundle: só os testes importam). */

export function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

type Route = (init?: RequestInit) => Response;

/** BFF simulado: "MÉTODO /api/rota" → resposta. Devolve o mock para conferir as chamadas. */
export function mockApi(routes: Record<string, Route>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const route = routes[`${init?.method ?? 'GET'} ${url}`];
    return route ? route(init) : Response.json({ message: 'não encontrado' }, { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Corpo JSON enviado numa chamada (ex.: `{ amount: 500 }`). */
export function sentBody(fetchMock: ReturnType<typeof mockApi>, method: string, url: string) {
  const call = fetchMock.mock.calls.find(([u, init]) => u === url && init?.method === method);
  return call ? (JSON.parse(String(call[1]?.body)) as unknown) : undefined;
}

// O Intl usa espaço não separável (U+00A0) em "R$ 1,00".
export const normalize = (text: string | null | undefined) => (text ?? '').replace(/ /g, ' ');

/** Valor de uma linha da SummaryList ("Saldo depois" → "R$ 1.750,50"). */
export function rowValue(label: string, container?: HTMLElement) {
  const scope = container ? within(container) : screen;
  return normalize(scope.getByText(label).nextElementSibling?.textContent);
}
