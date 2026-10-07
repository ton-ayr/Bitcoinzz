import { ApiError, parseApiResponse } from './http';
import { serverWake } from './server-wake';

/**
 * Chamada do navegador para o BFF (`/api/...`). O cookie da sessão vai sozinho;
 * o token nunca passa pelo JavaScript.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');

  try {
    const response = await serverWake.track(fetch(`/api/${path}`, { ...init, headers }));
    return await parseApiResponse<T>(response);
  } catch (error) {
    // Sessão expirada em qualquer chamada de dados: volta para o login.
    if (error instanceof ApiError && error.status === 401 && !path.startsWith('auth/')) {
      // Recarga completa de propósito: descarta da memória todos os dados do usuário (cache do
      // React Query e rotas mantidas pelo Next), algo que a navegação interna não garante.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/login?reason=expired');
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
