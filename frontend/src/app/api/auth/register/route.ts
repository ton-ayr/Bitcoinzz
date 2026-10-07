import type { NextRequest } from 'next/server';
import { errorResponse, forwardToApi, isSameOrigin } from '@/server/bff';
import { apiUrl, setSessionCookie } from '@/server/session';

/** Cadastro + login automático: quem acabou de criar a conta já entra logado. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return errorResponse(403, 'Origem não permitida.');

  const body = await request.text();
  const created = await forwardToApi({ apiUrl: apiUrl(), method: 'POST', path: 'account', body });
  if (!created.ok) return created; // 400 / 409 / 429 com a mensagem da API

  const { email, password } = JSON.parse(body) as { email: string; password: string };
  const login = await forwardToApi({
    apiUrl: apiUrl(),
    method: 'POST',
    path: 'login',
    body: JSON.stringify({ email, password }),
  });
  if (login.ok) {
    const { token } = (await login.json()) as { token: string };
    await setSessionCookie(token);
  }

  // Conta criada; se o login automático falhar, a tela manda para o login normal.
  return Response.json({ ...(await created.json()), loggedIn: login.ok }, { status: 201 });
}
