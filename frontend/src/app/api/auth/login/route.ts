import type { NextRequest } from 'next/server';
import { errorResponse, forwardToApi, isSameOrigin } from '@/server/bff';
import { apiUrl, setSessionCookie } from '@/server/session';

/** Login: chama a API e guarda o JWT no cookie httpOnly. O token NÃO volta para o navegador. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return errorResponse(403, 'Origem não permitida.');

  const response = await forwardToApi({
    apiUrl: apiUrl(),
    method: 'POST',
    path: 'login',
    body: await request.text(),
  });
  if (!response.ok) return response; // 400 / 401 / 429 com a mensagem da API

  const { token } = (await response.json()) as { token: string };
  await setSessionCookie(token);
  return Response.json({ ok: true });
}
