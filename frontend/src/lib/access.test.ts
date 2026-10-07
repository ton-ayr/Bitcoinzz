import { describe, expect, it } from 'vitest';
import { resolveAccess, safeNextPath } from './access';

describe('resolveAccess', () => {
  it('raiz: dashboard se logado, login se não', () => {
    expect(resolveAccess('/', true)).toBe('/dashboard');
    expect(resolveAccess('/', false)).toBe('/login');
  });

  it.each(['/dashboard', '/deposit', '/buy', '/sell', '/statement', '/dashboard/qualquer'])(
    'sem sessão, %s manda para o login lembrando a página',
    (path) => {
      expect(resolveAccess(path, false)).toBe(`/login?next=${encodeURIComponent(path)}`);
    },
  );

  it('com sessão, páginas protegidas seguem normalmente', () => {
    expect(resolveAccess('/dashboard', true)).toBeNull();
    expect(resolveAccess('/statement', true)).toBeNull();
  });

  it('logado não vê login nem cadastro', () => {
    expect(resolveAccess('/login', true)).toBe('/dashboard');
    expect(resolveAccess('/register', true)).toBe('/dashboard');
    expect(resolveAccess('/login', false)).toBeNull();
  });

  it('não confunde caminhos parecidos', () => {
    expect(resolveAccess('/dashboards', false)).toBeNull();
    expect(resolveAccess('/buyers', false)).toBeNull();
  });
});

describe('safeNextPath (evita redirecionar para outro site)', () => {
  it.each([
    ['/statement', '/statement'],
    [null, '/dashboard'],
    ['https://site-malicioso.com', '/dashboard'],
    ['//site-malicioso.com', '/dashboard'],
  ])('%s → %s', (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });
});
