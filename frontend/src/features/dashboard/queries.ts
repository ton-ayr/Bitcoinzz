'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Balance, HistoryPoint, Position, Quote, Volume } from './types';

const SECOND = 1000;

// Cada dado tem seu ritmo de atualização (definido na ARQUITETURA, seção 8.3).
export const useBalance = () =>
  useQuery({ queryKey: queryKeys.balance, queryFn: () => api.get<Balance>('account/balance') });

export const useQuote = () =>
  useQuery({
    queryKey: queryKeys.quote,
    queryFn: () => api.get<Quote>('btc/price'),
    refetchInterval: 15 * SECOND,
  });

export const useVolume = () =>
  useQuery({
    queryKey: queryKeys.volume,
    queryFn: () => api.get<Volume>('volume'),
    refetchInterval: 30 * SECOND,
  });

export const usePosition = () =>
  useQuery({
    queryKey: queryKeys.position,
    queryFn: () => api.get<Position>('btc'),
    refetchInterval: 30 * SECOND,
  });

export const useHistory = () =>
  useQuery({
    queryKey: queryKeys.history,
    queryFn: () => api.get<HistoryPoint[]>('history'),
    refetchInterval: 60 * SECOND,
  });
