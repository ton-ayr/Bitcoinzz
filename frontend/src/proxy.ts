import { NextResponse, type NextRequest } from 'next/server';
import { resolveAccess } from '@/lib/access';

// Mesmo nome de cookie do src/server/session.ts (o proxy não importa módulos server-only).
const SESSION_COOKIE = 'bitcoinzz_session';

/**
 * Roda antes de cada página: sem sessão → login; logado na tela de login → dashboard.
 * Confere só se o cookie existe. A validade real do token é checada pela API a cada chamada.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const destination = resolveAccess(request.nextUrl.pathname, hasSession);
  return destination
    ? NextResponse.redirect(new URL(destination, request.url))
    : NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/deposit/:path*',
    '/buy/:path*',
    '/sell/:path*',
    '/statement/:path*',
    '/login',
    '/register',
  ],
};
