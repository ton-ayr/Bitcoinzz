// @vitest-environment jsdom
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DepositView } from './DepositView';
import { mockApi, normalize, renderWithQuery, rowValue, sentBody } from './test-utils';

const toastSuccess = vi.fn();
vi.mock('sonner', () => ({ toast: { success: (message: string) => toastSuccess(message) } }));

const balanceRoute = () => Response.json({ balance: 1250.5 });

function setup(deposit = () => Response.json({ balance: 1750.5 }, { status: 201 })) {
  const fetchMock = mockApi({
    'GET /api/account/balance': balanceRoute,
    'POST /api/account/deposit': deposit,
  });
  renderWithQuery(<DepositView />);
  const field = screen.getByLabelText('Valor do depósito') as HTMLInputElement;
  return { fetchMock, field, user: userEvent.setup() };
}

const depositCalls = (fetchMock: ReturnType<typeof mockApi>) =>
  fetchMock.mock.calls.filter(([url]) => url === '/api/account/deposit');

describe('DepositView', () => {
  beforeEach(() => toastSuccess.mockReset());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('os dígitos entram pelos centavos e o resumo mostra o saldo depois', async () => {
    const { field, user } = setup();
    await waitFor(() => expect(rowValue('Saldo atual')).toBe('R$ 1.250,50'));

    await user.type(field, '50000');

    expect(normalize(field.value)).toBe('R$ 500,00');
    expect(rowValue('Depósito')).toBe('+ R$ 500,00');
    expect(rowValue('Saldo depois')).toBe('R$ 1.750,50');
  });

  it('zero é campo vazio: o 1º dígito vira centavo mesmo com o cursor no início', async () => {
    const { field, user } = setup();
    expect(field.value).toBe('');
    expect(normalize(field.placeholder)).toBe('R$ 0,00');

    // Bug achado no navegador: com "R$ 0,00" no campo, o 1º dígito entrava antes dos zeros
    // (foco automático com o cursor no início) e "4" virava R$ 40,00.
    await user.type(field, '45', { initialSelectionStart: 0, initialSelectionEnd: 0 });
    expect(normalize(field.value)).toBe('R$ 0,45');

    await user.type(field, '{Backspace}{Backspace}');
    expect(field.value).toBe('');
  });

  it('selecionar tudo e digitar substitui o valor', async () => {
    const { field, user } = setup();
    await user.type(field, '999');
    await user.type(field, '7', {
      initialSelectionStart: 0,
      initialSelectionEnd: field.value.length,
    });
    expect(normalize(field.value)).toBe('R$ 0,07');
  });

  it('apagar remove o último dígito', async () => {
    const { field, user } = setup();
    await user.type(field, '12345{Backspace}');
    expect(normalize(field.value)).toBe('R$ 12,34');
  });

  it('atalhos somam ao valor', async () => {
    const { field, user } = setup();
    await user.click(screen.getByRole('button', { name: '+ R$ 100' }));
    await user.click(screen.getByRole('button', { name: '+ R$ 100' }));
    await user.click(screen.getByRole('button', { name: '+ R$ 1.000' }));
    expect(normalize(field.value)).toBe('R$ 1.200,00');
  });

  it('sem valor: pede o valor e não chama a API', async () => {
    const { fetchMock, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Depositar' }));

    expect(screen.getByText('Informe o valor do depósito')).toBeTruthy();
    expect(depositCalls(fetchMock)).toHaveLength(0);
  });

  it('acima do limite: avisa enquanto digita e não chama a API', async () => {
    const { fetchMock, field, user } = setup();
    await user.type(field, '100000001'); // R$ 1.000.000,01

    expect(screen.getByText(/O valor máximo por depósito é/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Depositar' }));
    expect(depositCalls(fetchMock)).toHaveLength(0);
  });

  it('sucesso: envia o valor em R$, mostra o resumo real e permite um novo depósito', async () => {
    const { fetchMock, field, user } = setup();
    await user.type(field, '50000');
    await user.click(screen.getByRole('button', { name: 'Depositar' }));

    expect(await screen.findByRole('heading', { name: 'Depósito realizado!' })).toBeTruthy();
    expect(sentBody(fetchMock, 'POST', '/api/account/deposit')).toEqual({ amount: 500 });
    expect(rowValue('Valor depositado')).toBe('R$ 500,00');
    expect(rowValue('Novo saldo')).toBe('R$ 1.750,50');
    expect(normalize(toastSuccess.mock.calls[0]?.[0])).toBe('Depósito de R$ 500,00 realizado');
    expect(screen.getByRole('link', { name: 'Comprar bitcoin' }).getAttribute('href')).toBe('/buy');

    await user.click(screen.getByRole('button', { name: 'Novo depósito' }));
    expect((screen.getByLabelText('Valor do depósito') as HTMLInputElement).value).toBe('');
  });

  it('erro da API aparece no formulário', async () => {
    const { field, user } = setup(() =>
      Response.json(
        { statusCode: 503, message: 'Servidor indisponível no momento.' },
        { status: 503 },
      ),
    );
    await user.type(field, '1000');
    await user.click(screen.getByRole('button', { name: 'Depositar' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Servidor indisponível no momento.',
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
