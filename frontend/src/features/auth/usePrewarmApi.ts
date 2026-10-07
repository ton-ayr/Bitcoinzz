'use client';

import { useEffect } from 'react';
import { serverWake } from '@/lib/server-wake';

/**
 * "Acorda" a API assim que a tela de login/cadastro abre: no plano gratuito do Render
 * ela dorme após 15 min sem uso. Enquanto a pessoa digita, a API já vai iniciando.
 */
export function usePrewarmApi() {
  useEffect(() => {
    void serverWake.track(fetch('/api/health').catch(() => undefined));
  }, []);
}
