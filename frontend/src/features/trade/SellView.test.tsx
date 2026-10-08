// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PositionItem } from '@/features/dashboard/types';
import { SellView } from './SellView';
import { mockApi, normalize, renderWithQuery, rowValue, sentBody } from './test-utils';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

// Cotação de compra R$ 500.000: A vale R$ 1.000 e B vale R$ 500 (posição de R$ 1.500).
const INVESTMENTS: PositionItem[] = [
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
    investedAmount: 450,
    btcAmount: 0.001,
    btcPriceAtPurchase: 450000,
    priceVariationPercent: 11.11,
    currentValue: 500,
    origin: 'PURCHASE',
  },
];

const saleOk = () =>
  Response.json(
    {
      amount: 600,
      btcAmount: 0.0012,
      btcPrice: 500000,
      reinvestment: { amount: 320, btcAmount: 0.0008, btcPrice: 400000 },
      balance: 700,
    },
    { status: 201 },
  );

async function setup(investments = INVESTMENTS) {
  const fetchMock = mockApi({
    'GET /api/account/balance': () => Response.json({ balance: 100 }),
    'GET /api/btc/price': () =>
      Response.json({ buy: 500000, sell: 500001, updatedAt: new Date().toISOString() }),
    'GET /api/btc': () =>
      Response.json({
        summary: {
          invested: 1250,
          btcAmount: 0.003,
          currentValue: 1500,
          returnPercent: 20,
          currentBtcPrice: 500000,
        },
        investments,
      }),
    'POST /api/btc/sell': saleOk,
  });
  renderWithQuery(<SellView />);
  await waitFor(() => expect(rowValue('Cotação de compra')).toBe('R$ 500.000,00'));
  const field = screen.getByLabelText('Valor da venda') as HTMLInputElement;
  return { fetchMock, field, user: userEvent.setup() };
}

describe('SellView', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('prévia mostra o FIFO: o mais antigo inteiro, o seguinte em parte, e a sobra', async () => {
    const { field, user } = await setup();
    await user.type(field, '120000'); // R$ 1.200,00 = A inteiro (R$ 1.000) + R$ 200 de B

    expect(rowValue('BTC vendido (estimado)')).toBe('≈ ₿ 0,00240000');
    expect(rowValue('Você recebe')).toBe('R$ 1.200,00');
    expect(rowValue('Saldo depois')).toBe('R$ 1.300,00');

    const steps = within(screen.getByRole('list', { name: 'Investimentos usados na venda' }))
      .getAllByRole('listitem')
      .map((item) => normalize(item.textContent));
    expect(steps).toHaveLength(2);
    expect(steps[0]).toContain('Vendido inteiro');
    expect(steps[1]).toContain('Venda parcial');
    expect(steps[1]).toContain('Sobra ₿ 0,00060000 → reinvestimento de R$ 270,00');
  });

  it('acima da posição: mesma mensagem da API e sem confirmação', async () => {
    const { field, user } = await setup();
    await user.type(field, '150001');

    expect(normalize(screen.getByText(/^Valor maior que a sua posição/).textContent)).toBe(
      'Valor maior que a sua posição. Máximo disponível para venda: R$ 1.500,00.',
    );
    await user.click(screen.getByRole('button', { name: 'Revisar venda' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('campo vazio: "Saldo depois" mostra o saldo atual (igual à compra e ao depósito)', async () => {
    await setup();
    expect(rowValue('Saldo depois')).toBe('R$ 100,00');
    expect(rowValue('Você recebe')).toBe('—');
  });

  it('"Tudo" preenche o valor da posição inteira', async () => {
    const { field, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Tudo' }));
    expect(normalize(field.value)).toBe('R$ 1.500,00');
  });

  it('revisar → confirmar: envia o valor em R$ e mostra o resgate e o reinvestimento reais', async () => {
    const { fetchMock, field, user } = await setup();
    await user.type(field, '60000'); // R$ 600: parcial do investimento A
    await user.click(screen.getByRole('button', { name: 'Revisar venda' }));

    const dialog = await screen.findByRole('dialog', { name: 'Revise a venda' });
    expect(rowValue('Reinvestimento', dialog)).toBe('₿ 0,00080000 (R$ 320,00)');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar venda' }));

    expect(await screen.findByRole('heading', { name: 'Venda realizada!' })).toBeTruthy();
    expect(sentBody(fetchMock, 'POST', '/api/btc/sell')).toEqual({ amount: 600 });
    expect(rowValue('Valor resgatado')).toBe('R$ 600,00');
    expect(rowValue('Reinvestimento')).toBe('₿ 0,00080000 (R$ 320,00)');
    expect(rowValue('Novo saldo')).toBe('R$ 700,00');
    expect(screen.getByRole('link', { name: 'Ver no extrato' }).getAttribute('href')).toBe(
      '/statement',
    );
  });

  it('sem bitcoins: convida a comprar', async () => {
    await setup([]);
    expect(screen.getByText('Você ainda não tem bitcoins para vender.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Comprar' }).getAttribute('href')).toBe('/buy');
  });
});
