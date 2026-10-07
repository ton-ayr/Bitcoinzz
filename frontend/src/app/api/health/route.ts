import { forwardToApi } from '@/server/bff';
import { apiUrl } from '@/server/session';

/**
 * Usado para "acordar" a API: a tela de login chama esta rota assim que abre,
 * e a API do Render (plano gratuito) já vai iniciando enquanto a pessoa digita.
 */
export async function GET() {
  return forwardToApi({ apiUrl: apiUrl(), method: 'GET', path: 'health' });
}
