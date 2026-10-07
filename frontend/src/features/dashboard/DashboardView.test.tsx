// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardView } from './DashboardView';
import type { Position } from './types';

// O gráfico (SVG com medidas) não é o foco aqui; ele tem testes próprios da lógica (history.test.ts).
vi.mock('./HistoryChart', () => ({ HistoryChart: () => <div>gráfico</div> }));

const emptyPosition: Position = {
  summary: { invested: 0, btcAmount: 0, currentValue: 0, returnPercent: 0, currentBtcPrice: null },
  investments: [],
};

const withInvestments: Position = {
  summary: {
    invested: 800,
    btcAmount: 0.00187242,
    currentValue: 1000,
    returnPercent: 25,
    currentBtcPrice: 500000,
  },
  investments: [
    {
      id: 'a',
      purchasedAt: '2026-10-01T13:00:00Z',
      investedAmount: 800,
      btcAmount: 0.002,
      btcPriceAtPurchase: 400000,
      priceVariationPercent: 25,
      currentValue: 1000,
      origin: 'PURCHASE',
    },
    {
      id: 'b',
      purchasedAt: '2026-10-02T13:00:00Z',
      investedAmount: 320,
      btcAmount: 0.0008,
      btcPriceAtPurchase: 400000,
      priceVariationPercent: -3.12,
      currentValue: 310,
      origin: 'REINVESTMENT',
    },
  ],
};

/** API simulada pelo BFF: cada rota devolve um JSON fixo. */
function mockApi(position: Position) {
  const routes: Record<string, unknown> = {
    '/api/account': { id: '1', name: 'Fulano da Silva', email: 'f@f.com' },
    '/api/account/balance': { balance: 1250.5 },
    '/api/btc/price': { buy: 427253, sell: 427254, updatedAt: new Date().toISOString() },
    '/api/volume': { date: '2026-10-07', bought: 0.5, sold: 0.25 },
    '/api/btc': position,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      Response.json(routes[url] ?? {}, { status: routes[url] ? 200 : 404 }),
    ),
  );
}

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

// O Intl usa espaço não separável (U+00A0) em "R$ 1,00".
const text = (value: string) => (content: string) => content.replace(/ /g, ' ') === value;

describe('DashboardView', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('cumprimenta pelo primeiro nome e mostra cotação e volume formatados', async () => {
    mockApi(emptyPosition);
    renderWithQuery(<DashboardView />);

    expect(await screen.findByRole('heading', { name: 'Olá, Fulano!' })).toBeTruthy();
    expect(await screen.findByText('ao vivo')).toBeTruthy();
    expect(await screen.findByText(text('₿ 0,50000000'))).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Comprar' }).getAttribute('href')).toBe('/buy');
  });

  it('sem investimentos: estado vazio com o atalho para comprar', async () => {
    mockApi(emptyPosition);
    renderWithQuery(<DashboardView />);

    expect(await screen.findByText('Você ainda não tem bitcoins')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Comprar bitcoin' }).getAttribute('href')).toBe('/buy');
  });

  it('com investimentos: tabela com valores formatados, variação e reinvestimento', async () => {
    mockApi(withInvestments);
    renderWithQuery(<DashboardView />);

    const table = await screen.findByRole('table', { name: 'Posição dos investimentos' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // cabeçalho + 2 investimentos
    expect(within(rows[1]!).getByText(text('R$ 800,00'))).toBeTruthy();
    expect(within(rows[1]!).getByText(text('+25,00%'))).toBeTruthy();
    expect(within(rows[2]!).getByText('Reinvestimento')).toBeTruthy();
    expect(within(rows[2]!).getByText(text('-3,12%'))).toBeTruthy();
  });
});
