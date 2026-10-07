/** Páginas que exigem login. */
export const PROTECTED_PATHS = ['/dashboard', '/deposit', '/buy', '/sell', '/statement'] as const;
/** Páginas só para quem NÃO está logado. */
export const AUTH_PATHS = ['/login', '/register'] as const;

export const HOME_PATH = '/dashboard';
export const LOGIN_PATH = '/login';

const matches = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Decide para onde mandar a pessoa antes de renderizar a página.
 * Devolve o destino do redirecionamento, ou `null` se pode seguir.
 */
export function resolveAccess(pathname: string, hasSession: boolean): string | null {
  if (pathname === '/') return hasSession ? HOME_PATH : LOGIN_PATH;

  if (!hasSession && PROTECTED_PATHS.some((base) => matches(pathname, base))) {
    // Guarda a página pedida para voltar a ela depois do login.
    return `${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`;
  }

  if (hasSession && AUTH_PATHS.some((base) => matches(pathname, base))) {
    return HOME_PATH;
  }

  return null;
}

/** Só aceita voltar para páginas internas (evita redirecionar para outro site: "open redirect"). */
export function safeNextPath(next: string | null | undefined): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return HOME_PATH;
}
