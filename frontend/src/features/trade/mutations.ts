'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Balance } from '@/features/dashboard/types';
import { api } from '@/lib/api-client';
import { formatBRL, formatBTC } from '@/lib/format';
import { ApiError } from '@/lib/http';
import { toReais } from '@/lib/money';
import { queryKeys } from '@/lib/query-keys';
import type { DepositResult, PurchaseResult, SaleResult } from './types';

// Depois de cada operação, o cache é atualizado: o dashboard já mostra os números novos
// sem recarregar a página. O saldo vem na própria resposta; o resto é buscado de novo.

export function useDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountCents: number) =>
      api.post<DepositResult>('account/deposit', { amount: toReais(amountCents) }),
    onSuccess: (result, amountCents) => {
      queryClient.setQueryData<Balance>(queryKeys.balance, { balance: result.balance });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statements });
      toast.success(`Depósito de ${formatBRL(toReais(amountCents))} realizado`);
    },
  });
}

/** Compra e venda mexem em saldo, posição, volume do dia e extrato. */
function useTradeCacheUpdate() {
  const queryClient = useQueryClient();
  return (result: { balance: number }) => {
    queryClient.setQueryData<Balance>(queryKeys.balance, { balance: result.balance });
    for (const queryKey of [queryKeys.position, queryKeys.volume, queryKeys.statements]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };
}

export function usePurchase() {
  const queryClient = useQueryClient();
  const updateCache = useTradeCacheUpdate();
  return useMutation({
    mutationFn: (amountCents: number) =>
      api.post<PurchaseResult>('btc/purchase', { amount: toReais(amountCents) }),
    onSuccess: (result) => {
      updateCache(result);
      toast.success(`Compra de ${formatBTC(result.btcAmount)} realizada`);
    },
    onError: (error) => {
      // 422 de saldo: o saldo mudou (ex.: em outra aba). Busca de novo para a prévia ficar certa.
      if (error instanceof ApiError && error.status === 422) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.balance });
      }
    },
  });
}

export function useSell() {
  const queryClient = useQueryClient();
  const updateCache = useTradeCacheUpdate();
  return useMutation({
    mutationFn: (amountCents: number) =>
      api.post<SaleResult>('btc/sell', { amount: toReais(amountCents) }),
    onSuccess: (result) => {
      updateCache(result);
      toast.success(`Venda de ${formatBRL(result.amount)} realizada`);
    },
    onError: (error) => {
      // 422: a posição mudou (outra aba) ou a cotação caiu. Busca de novo para a prévia ficar certa.
      if (error instanceof ApiError && error.status === 422) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.position });
      }
    },
  });
}
