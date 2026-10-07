/**
 * Chaves do cache do React Query num lugar só.
 * Depois de um depósito, compra ou venda, as telas invalidam estas chaves para buscar dados novos.
 */
export const queryKeys = {
  profile: ['profile'] as const,
  balance: ['balance'] as const,
  quote: ['quote'] as const,
  volume: ['volume'] as const,
  position: ['position'] as const,
  history: ['history'] as const,
  statement: (from?: string, to?: string) => ['statement', from ?? null, to ?? null] as const,
  /** Prefixo de todos os extratos: invalidar esta chave atualiza qualquer intervalo de datas. */
  statements: ['statement'] as const,
};
