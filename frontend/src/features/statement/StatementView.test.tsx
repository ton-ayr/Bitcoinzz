// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalize, renderWithQuery } from '@/features/trade/test-utils';
import { StatementView } from './StatementView';
import type { StatementTransaction } from './types';

const TRANSACTIONS: StatementTransaction[] = [
  // Hoje (07/10, horário de São Paulo)
  {
    id: 'p',
    type: 'PURCHASE',
    amount: 1500,
    btcAmount: 0.00358609,
    btcPrice: 418282,
    createdAt: '2026-10-07T14:00:00.000Z',
  },
  {
    id: 'd',
    type: 'DEPOSIT',
    amount: 5000,
    btcAmount: null,
    btcPrice: null,
    createdAt: '2026-10-07T13:00:00.000Z',
  },
  // Ontem: venda parcial (venda + reinvestimento)
  {
    id: 'r',
    type: 'REINVESTMENT',
    amount: 320,
    btcAmount: 0.0008,
    btcPrice: 400000,
    createdAt: '2026-10-06T12:00:00.001Z',
  },
  {
    id: 's',
    type: 'SALE',
    amount: 600,
    btcAmount: 0.0012,
    btcPrice: 500000,
    createdAt: '2026-10-06T12:00:00.000Z',
  },
  {
    id: 'old',
    type: 'DEPOSIT',
    amount: 100,
    btcAmount: null,
    btcPrice: null,
    createdAt: '2026-10-01T12:00:00.000Z',
  },
];

function mockStatement(transactions = TRANSACTIONS) {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    const params = new URL(url, 'http://localhost').searchParams;
    return Response.json({ from: params.get('from'), to: params.get('to'), transactions });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const requestedUrls = (fetchMock: ReturnType<typeof mockStatement>) =>
  fetchMock.mock.calls.map(([url]) => url);

const rowsOf = (day: string) =>
  within(screen.getByRole('region', { name: day }))
    .getAllByRole('listitem')
    .map((item) => normalize(item.textContent));

describe('StatementView', () => {
  beforeEach(() => {
    // Só o relógio é falso (o resto dos timers segue real): "hoje" = 07/10/2026, 12:00 em SP.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T15:00:00Z'));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('padrão de 90 dias, agrupado por dia, com sinais, cotação e totais', async () => {
    const fetchMock = mockStatement();
    renderWithQuery(<StatementView />);

    expect(await screen.findByRole('region', { name: 'Hoje' })).toBeTruthy();
    expect(requestedUrls(fetchMock)).toEqual(['/api/extract?from=2026-07-09&to=2026-10-07']);

    // Cada linha: tipo, valor com sinal e, embaixo, BTC, cotação e hora (São Paulo)
    expect(rowsOf('Hoje')).toEqual([
      'Compra de BTC− R$ 1.500,00₿ 0,00358609 a R$ 418.282,00 · 11:00',
      'Depósito+ R$ 5.000,0010:00',
    ]);
    expect(rowsOf('Ontem')).toEqual([
      'ReinvestimentoR$ 320,00₿ 0,00080000 a R$ 400.000,00 · 09:00 · sobra da venda, com a cotação original',
      'Venda de BTC+ R$ 600,00₿ 0,00120000 a R$ 500.000,00 · 09:00',
    ]);
    expect(screen.getByRole('region', { name: '01/10/2026' })).toBeTruthy();

    // Totais do período (reinvestimento não entra no dinheiro)
    expect(screen.getByText(normalizeMatch('R$ 5.100,00'))).toBeTruthy();
    expect(screen.getByText('2 depósitos')).toBeTruthy();
    expect(screen.getByText(normalizeMatch('₿ 0,00120000 em 1 venda'))).toBeTruthy();
  });

  it('atalho de 7 dias busca o novo período', async () => {
    const fetchMock = mockStatement();
    const user = userEvent.setup();
    renderWithQuery(<StatementView />);
    await screen.findByRole('region', { name: 'Hoje' });

    await user.click(screen.getByRole('button', { name: '7 dias' }));

    await waitFor(() =>
      expect(requestedUrls(fetchMock)).toContain('/api/extract?from=2026-09-30&to=2026-10-07'),
    );
    expect(screen.getByRole('button', { name: '7 dias' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('filtro por tipo e CSV só com o que está na tela', async () => {
    mockStatement();
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:extrato';
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderWithQuery(<StatementView />);
    await screen.findByRole('region', { name: 'Hoje' });

    await user.click(screen.getByRole('button', { name: 'Vendas (1)' }));

    expect(screen.queryByRole('region', { name: 'Hoje' })).toBeNull();
    expect(rowsOf('Ontem')).toHaveLength(1);
    expect(screen.getByText('Venda de BTC')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    const csv = await blobs[0]!.text();
    expect(csv.split('\r\n')).toEqual([
      'Data;Hora;Tipo;Valor (R$);BTC;Cotação (R$)',
      '06/10/2026;09:00;Venda de BTC;600,00;0,00120000;500000,00',
    ]);
  });

  it('extrato fora do ar: totais mostram o erro (e não R$ 0,00) e dá para tentar de novo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { statusCode: 503, message: 'Servidor indisponível no momento.' },
          { status: 503 },
        ),
      ),
    );
    renderWithQuery(<StatementView />);

    expect(await screen.findByText('Não foi possível carregar o extrato')).toBeTruthy();
    expect(screen.getAllByText('Não foi possível carregar.')).toHaveLength(3);
    expect(screen.queryByText(normalizeMatch('R$ 0,00'))).toBeNull();
    expect(screen.getByRole('button', { name: 'Tentar carregar Depositado de novo' })).toBeTruthy();
  });

  it('período sem lançamentos: estado vazio e CSV desligado', async () => {
    mockStatement([]);
    renderWithQuery(<StatementView />);

    expect(await screen.findByText('Nenhuma movimentação no período')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Exportar CSV' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

/** Compara ignorando o espaço não separável do Intl ("R$ 1,00"). */
function normalizeMatch(expected: string) {
  return (content: string) => normalize(content) === expected;
}
