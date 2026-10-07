// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PurchaseView } from './PurchaseView';
import { mockApi, normalize, renderWithQuery, rowValue, sentBody } from './test-utils';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const purchaseOk = () =>
  Response.json(
    { amount: 1500, btcAmount: 0.00358609, btcPrice: 418282, balance: 1800 },
    { status: 201 },
  );

async function setup({ balance = 3300, purchase = purchaseOk } = {}) {
  const fetchMock = mockApi({
    'GET /api/account/balance': () => Response.json({ balance }),
    'GET /api/btc/price': () =>
      Response.json({ buy: 418281, sell: 418282, updatedAt: new Date().toISOString() }),
    'POST /api/btc/purchase': purchase,
  });
  renderWithQuery(<PurchaseView />);
  // Espera saldo e cotação chegarem (o botão de revisar só libera com os dois).
  await waitFor(() => expect(rowValue('Cotação de venda')).toBe('R$ 418.282,00'));
  const field = screen.getByLabelText('Valor da compra') as HTMLInputElement;
  return { fetchMock, field, user: userEvent.setup() };
}

describe('PurchaseView', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('prévia ao vivo: BTC estimado pela cotação de venda e saldo depois', async () => {
    const { field, user } = await setup();
    await user.type(field, '150000'); // R$ 1.500,00

    expect(rowValue('Você recebe (estimado)')).toBe('≈ ₿ 0,00358609');
    expect(rowValue('Saldo atual')).toBe('R$ 3.300,00');
    expect(rowValue('Saldo depois')).toBe('R$ 1.800,00');
  });

  it('acima do saldo: avisa e não abre a confirmação', async () => {
    const { field, user } = await setup();
    await user.type(field, '400000');

    expect(normalize(screen.getByText(/^Saldo insuficiente/).textContent)).toBe(
      'Saldo insuficiente. Disponível: R$ 3.300,00.',
    );
    await user.click(screen.getByRole('button', { name: 'Revisar compra' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('atalhos de % preenchem parte do saldo', async () => {
    const { field, user } = await setup();
    await user.click(screen.getByRole('button', { name: '50%' }));
    expect(normalize(field.value)).toBe('R$ 1.650,00');
    await user.click(screen.getByRole('button', { name: 'Tudo' }));
    expect(normalize(field.value)).toBe('R$ 3.300,00');
  });

  it('revisar → confirmar: envia o valor em R$ e mostra o resultado real', async () => {
    const { fetchMock, field, user } = await setup();
    await user.type(field, '150000');
    await user.click(screen.getByRole('button', { name: 'Revisar compra' }));

    const dialog = await screen.findByRole('dialog', { name: 'Revise a compra' });
    expect(rowValue('Valor', dialog)).toBe('R$ 1.500,00');
    expect(rowValue('Você recebe (estimado)', dialog)).toBe('≈ ₿ 0,00358609');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar compra' }));

    expect(await screen.findByRole('heading', { name: 'Compra realizada!' })).toBeTruthy();
    expect(sentBody(fetchMock, 'POST', '/api/btc/purchase')).toEqual({ amount: 1500 });
    expect(rowValue('Você comprou')).toBe('₿ 0,00358609');
    expect(rowValue('Novo saldo')).toBe('R$ 1.800,00');
  });

  it('cancelar a confirmação não compra', async () => {
    const { fetchMock, field, user } = await setup();
    await user.type(field, '1000');
    await user.click(screen.getByRole('button', { name: 'Revisar compra' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/btc/purchase')).toBe(false);
  });

  it('erro da API (ex.: cotação fora do ar): fecha o diálogo e mostra a mensagem', async () => {
    const { field, user } = await setup({
      purchase: () =>
        Response.json(
          { statusCode: 503, message: 'Cotação indisponível no momento.' },
          { status: 503 },
        ),
    });
    await user.type(field, '1000');
    await user.click(screen.getByRole('button', { name: 'Revisar compra' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirmar compra' }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('alert').textContent).toBe('Cotação indisponível no momento.');
  });

  it('sem saldo: convida a depositar e desliga os atalhos', async () => {
    await setup({ balance: 0 });

    expect(screen.getByText('Você ainda não tem saldo para investir.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Depositar' }).getAttribute('href')).toBe('/deposit');
    expect(screen.getByRole('button', { name: 'Tudo' }).getAttribute('aria-disabled')).toBe('true');
  });
});
