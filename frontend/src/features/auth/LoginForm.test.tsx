// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

const router = { replace: vi.fn(), refresh: vi.fn() };
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

/** fetch falso: /api/health responde ok; o login responde o que cada teste definir. */
function mockFetch(loginResponse: Response) {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
    url === '/api/health' ? Response.json({ status: 'ok' }) : loginResponse,
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const loginCalls = (fetchMock: ReturnType<typeof mockFetch>) =>
  fetchMock.mock.calls.filter(([url]) => url === '/api/auth/login');

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('E-mail'), email);
  await user.type(screen.getByLabelText('Senha'), password);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    router.replace.mockReset();
    router.refresh.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('"acorda" a API assim que abre', () => {
    const fetchMock = mockFetch(Response.json({ ok: true }));
    render(<LoginForm />);
    expect(fetchMock).toHaveBeenCalledWith('/api/health');
  });

  it('valida antes de enviar (sem chamar a API)', async () => {
    const fetchMock = mockFetch(Response.json({ ok: true }));
    render(<LoginForm />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o e-mail')).toBeTruthy();
    expect(screen.getByText('Informe a senha')).toBeTruthy();
    expect(loginCalls(fetchMock)).toHaveLength(0);
  });

  it('sucesso: envia o e-mail normalizado e vai para o dashboard', async () => {
    const fetchMock = mockFetch(Response.json({ ok: true }));
    render(<LoginForm />);

    await fillAndSubmit('  Fulano@Email.com', 'fulano123');

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
    const [, init] = loginCalls(fetchMock)[0]!;
    expect(JSON.parse(init!.body as string)).toEqual({
      email: 'fulano@email.com',
      password: 'fulano123',
    });
  });

  it('volta para a página que a pessoa tentou abrir (?next=), só se for interna', async () => {
    searchParams = new URLSearchParams('next=/statement');
    mockFetch(Response.json({ ok: true }));
    render(<LoginForm />);
    await fillAndSubmit('fulano@email.com', 'fulano123');
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/statement'));

    cleanup();
    router.replace.mockReset();
    searchParams = new URLSearchParams('next=https://site-malicioso.com');
    render(<LoginForm />);
    await fillAndSubmit('fulano@email.com', 'fulano123');
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('credenciais erradas: mostra a mensagem da API e não navega', async () => {
    mockFetch(
      Response.json({ statusCode: 401, message: 'E-mail ou senha inválidos' }, { status: 401 }),
    );
    render(<LoginForm />);

    await fillAndSubmit('fulano@email.com', 'errada123');

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'E-mail ou senha inválidos',
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('avisa quando a sessão expirou (?reason=expired)', () => {
    searchParams = new URLSearchParams('reason=expired');
    mockFetch(Response.json({ ok: true }));
    render(<LoginForm />);
    expect(screen.getByText('Sua sessão expirou. Entre novamente.')).toBeTruthy();
  });

  it('botão mostra e oculta a senha', async () => {
    mockFetch(Response.json({ ok: true }));
    render(<LoginForm />);
    const user = userEvent.setup();
    const input = screen.getByLabelText('Senha');

    expect(input.getAttribute('type')).toBe('password');
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input.getAttribute('type')).toBe('text');
    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(input.getAttribute('type')).toBe('password');
  });
});
