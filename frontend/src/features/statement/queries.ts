'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { DateRange } from './statement';
import type { Statement } from './types';

/**
 * Extrato do período. `null` = ainda não dá para buscar (data de hoje não chegou ou período
 * inválido). Ao trocar o período, o anterior continua na tela até o novo chegar.
 */
export const useStatement = (range: DateRange | null) =>
  useQuery({
    queryKey: queryKeys.statement(range?.from, range?.to),
    queryFn: () => api.get<Statement>(`extract?${new URLSearchParams({ ...range })}`),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  });
