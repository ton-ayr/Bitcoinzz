import type { NextRequest } from 'next/server';
import {
  errorResponse,
  forwardToApi,
  isAllowedRoute,
  isSameOrigin,
  type HttpMethod,
} from '@/server/bff';
import { apiUrl, clearSessionCookie, getSessionToken } from '@/server/session';

interface Context {
  params: Promise<{ path: string[] }>;
}

/**
 * Repasse genérico: /api/account/balance → API /account/balance, com o JWT do cookie.
 * A proteção não depende só do proxy.ts: aqui também se exige sessão (recomendação da doc do Next).
 */
async function handle(request: NextRequest, context: Context, method: HttpMethod) {
  const path = (await context.params).path.join('/');

  if (!isAllowedRoute(method, path)) return errorResponse(404, 'Rota não encontrada.');
  if (method === 'POST' && !isSameOrigin(request)) {
    return errorResponse(403, 'Origem não permitida.');
  }

  const token = await getSessionToken();
  if (!token) return errorResponse(401, 'Sessão expirada. Faça login novamente.');

  const response = await forwardToApi({
    apiUrl: apiUrl(),
    method,
    path,
    search: request.nextUrl.search,
    body: method === 'POST' ? await request.text() : undefined,
    token,
  });

  // Token recusado pela API (expirado ou inválido): encerra a sessão no navegador.
  if (response.status === 401) await clearSessionCookie();
  return response;
}

export function GET(request: NextRequest, context: Context) {
  return handle(request, context, 'GET');
}

export function POST(request: NextRequest, context: Context) {
  return handle(request, context, 'POST');
}
