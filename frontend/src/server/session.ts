import 'server-only';
import { cookies } from 'next/headers';
import { sessionMaxAge } from './bff';

export const SESSION_COOKIE = 'bitcoinzz_session';

/** Endereço da API: variável só do servidor (sem NEXT_PUBLIC_), então não vai para o navegador. */
export function apiUrl(): string {
  return process.env.API_URL ?? 'http://localhost:3333';
}

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Grava o JWT num cookie que o JavaScript da página não consegue ler. */
export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // invisível para o JavaScript (protege contra roubo por XSS)
    secure: process.env.NODE_ENV === 'production', // só HTTPS em produção
    sameSite: 'lax', // não é enviado em POSTs vindos de outros sites (CSRF)
    path: '/',
    maxAge: sessionMaxAge(token), // expira junto com o JWT (8 h)
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
