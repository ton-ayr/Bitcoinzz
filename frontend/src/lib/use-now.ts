'use client';

import { useSyncExternalStore } from 'react';
import { dayInSaoPaulo } from './dates';

// Relógio que "anda" a cada segundo, só no navegador (para textos como "atualizado há 12 s").
// No servidor (pré-renderização do Cache Components) devolve null: nenhuma data entra no HTML estático.
function subscribeToSeconds(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}
const currentSecond = () => Math.floor(Date.now() / 1000);
const noTimeOnServer = () => null;

export function useNow(): Date | null {
  const second = useSyncExternalStore(subscribeToSeconds, currentSecond, noTimeOnServer);
  return second === null ? null : new Date(second * 1000);
}

const currentDay = () => dayInSaoPaulo(new Date());

/**
 * Hoje em São Paulo ("2026-10-07"); null no servidor. O valor é um texto, então a tela só
 * renderiza de novo quando o dia muda (e não a cada segundo).
 */
export function useToday(): string | null {
  return useSyncExternalStore(subscribeToSeconds, currentDay, noTimeOnServer);
}
