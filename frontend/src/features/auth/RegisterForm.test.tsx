// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

const router = { replace: vi.fn(), refresh: vi.fn() };
const toastSuccess = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('sonner', () => ({ toast: { success: (message: string) => toastSuccess(message) } }));

function mockFetch(registerResponse: Response) {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
    url === '/api/health' ? Response.json({ status: 'ok' }) : registerResponse,
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function fill(
  fields: Partial<Record<'Nome' | 'E-mail' | 'Senha' | 'Confirmar senha', string>>,
) {
  const user = userEvent.setup();
  for (const [label, value] of Object.entries(fields)) {
    await user.type(screen.getByLabelText(label), value);
  }
  return user;
}

const ruleState = () =>
  Array.from(document.querySelectorAll('[aria-label="Regras da senha"] li')).map(
    (item) => item.getAttribute('data-ok') === 'true',
  );

describe('RegisterForm', () => {
  beforeEach(() => {
    router.replace.mockReset();
    toastSuccess.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('checklist da senha acompanha a digitação', async () => {
    mockFetch(Response.json({}));
    render(<RegisterForm />);
    expect(ruleState()).toEqual([false, false, false]);

    await fill({ Senha: 'abc' });
    expect(ruleState()).toEqual([false, true, false]);

    await fill({ Senha: 'defgh1' });
    expect(ruleState()).toEqual([true, true, true]);
  });

  it('confirmação diferente é recusada sem chamar a API', async () => {
    const fetchMock = mockFetch(Response.json({}));
    render(<RegisterForm />);
    const user = await fill({
      Nome: 'Fulano',
      'E-mail': 'fulano@email.com',
      Senha: 'fulano123',
      'Confirmar senha': 'outra123',
    });

    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('As senhas não conferem')).toBeTruthy();
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/auth/register')).toHaveLength(0);
  });

  it('e-mail já cadastrado (409): erro aparece embaixo do campo de e-mail', async () => {
    mockFetch(
      Response.json(
        { statusCode: 409, message: 'Este e-mail já está cadastrado' },
        { status: 409 },
      ),
    );
    render(<RegisterForm />);
    const user = await fill({
      Nome: 'Fulano',
      'E-mail': 'fulano@email.com',
      Senha: 'fulano123',
      'Confirmar senha': 'fulano123',
    });

    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Este e-mail já está cadastrado')).toBeTruthy();
    expect(screen.getByLabelText('E-mail').getAttribute('aria-invalid')).toBe('true');
  });

  it('sucesso: envia só nome, e-mail e senha, avisa e entra no dashboard', async () => {
    const fetchMock = mockFetch(
      Response.json(
        { id: '1', name: 'Fulano da Silva', email: 'fulano@email.com', loggedIn: true },
        { status: 201 },
      ),
    );
    render(<RegisterForm />);
    const user = await fill({
      Nome: 'Fulano da Silva',
      'E-mail': 'fulano@email.com',
      Senha: 'fulano123',
      'Confirmar senha': 'fulano123',
    });

    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
    const [, init] = fetchMock.mock.calls.find(([url]) => url === '/api/auth/register')!;
    expect(JSON.parse(init!.body as string)).toEqual({
      name: 'Fulano da Silva',
      email: 'fulano@email.com',
      password: 'fulano123',
    });
    expect(toastSuccess).toHaveBeenCalledWith('Conta criada! Bem-vindo(a), Fulano.');
  });
});
