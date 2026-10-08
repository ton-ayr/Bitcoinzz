/**
 * BFF (Backend for Frontend): o servidor do Next fica entre o navegador e a API.
 * - O navegador fala só com `/api/*` do próprio site.
 * - O JWT fica num cookie httpOnly: o JavaScript da página nunca lê o token.
 * - Só as rotas desta lista podem ser repassadas para a API.
 *
 * Este arquivo tem só funções puras (sem `next/headers`), por isso é fácil de testar.
 */

export type HttpMethod = 'GET' | 'POST';

/** Rotas da API que o front pode chamar através do BFF (método + caminho exato). */
export const ALLOWED_ROUTES: ReadonlySet<string> = new Set([
  'GET account',
  'GET account/balance',
  'POST account/deposit',
  'GET btc',
  'GET btc/price',
  'POST btc/purchase',
  'POST btc/sell',
  'GET extract',
  'GET volume',
  'GET history',
]);

export function isAllowedRoute(method: string, path: string): boolean {
  return ALLOWED_ROUTES.has(`${method.toUpperCase()} ${path}`);
}

/** A API do Render pode levar ~1 min para acordar no plano gratuito. */
export const API_TIMEOUT_MS = 90_000;

/** Resposta de erro no mesmo formato da API: `{ statusCode, message }`. */
export function errorResponse(statusCode: number, message: string): Response {
  return Response.json({ statusCode, message }, { status: statusCode });
}

export interface ForwardOptions {
  apiUrl: string;
  method: HttpMethod;
  /** Caminho da API sem a barra inicial (ex.: "account/balance"). */
  path: string;
  /** Query string, com ou sem "?" (ex.: "?from=2026-09-01"). */
  search?: string;
  body?: string;
  token?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * Repassa a chamada para a API e devolve a resposta dela (status + corpo).
 * Se a API não responder: 504 (demorou demais) ou 503 (fora do ar).
 */
export async function forwardToApi({
  apiUrl,
  method,
  path,
  search = '',
  body,
  token,
  timeoutMs = API_TIMEOUT_MS,
  fetchFn = fetch,
}: ForwardOptions): Promise<Response> {
  const query = search && !search.startsWith('?') ? `?${search}` : search;
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    const upstream = await fetchFn(`${apiUrl.replace(/\/$/, '')}/${path}${query}`, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return errorResponse(504, 'O servidor demorou demais para responder. Tente novamente.');
    }
    return errorResponse(503, 'Servidor indisponível no momento. Tente novamente em instantes.');
  }
}

const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60;

/**
 * Validade do cookie = validade do JWT (campo `exp`), para os dois expirarem juntos.
 * Só lê o payload (não valida a assinatura: quem valida é a API).
 */
export function sessionMaxAge(token: string, nowMs = Date.now()): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString());
    if (typeof payload.exp === 'number') {
      return Math.max(0, payload.exp - Math.floor(nowMs / 1000));
    }
  } catch {
    // token em formato inesperado: usa o padrão da API
  }
  return EIGHT_HOURS_IN_SECONDS;
}

/**
 * Defesa contra CSRF: um POST só é aceito se vier do próprio site.
 * (O cookie SameSite=Lax já bloqueia a maioria dos casos; isto é uma segunda barreira.)
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // navegadores sempre enviam Origin em POST; ferramentas como curl não
  try {
    return new URL(origin).host === publicHost(request);
  } catch {
    return false;
  }
}

/**
 * Host que o navegador acessou. A URL interna pode ser outra: no Docker, o servidor escuta em
 * 0.0.0.0:3000 e o navegador acessou localhost:3000; atrás de um proxy, o proxy informa o host
 * original em X-Forwarded-Host. Uma página de outro site não consegue trocar esses cabeçalhos.
 */
function publicHost(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('host') || new URL(request.url).host;
}
