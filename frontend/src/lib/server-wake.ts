/**
 * Detecta quando a API está "acordando" (Render free dorme após 15 min sem uso).
 * Se alguma requisição passa de SLOW_AFTER_MS, a tela mostra o aviso "Acordando o servidor…".
 * Store mínima compatível com `useSyncExternalStore` do React.
 */

export const SLOW_AFTER_MS = 2500;

type Listener = () => void;

let pending = 0;
let slow = false;
const listeners = new Set<Listener>();

function setSlow(value: boolean) {
  if (slow === value) return;
  slow = value;
  listeners.forEach((listener) => listener());
}

export const serverWake = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  isSlow(): boolean {
    return slow;
  },
  /** Acompanha uma requisição: se demorar, liga o aviso; quando todas terminam, desliga. */
  async track<T>(request: Promise<T>): Promise<T> {
    pending += 1;
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    try {
      return await request;
    } finally {
      clearTimeout(timer);
      pending -= 1;
      if (pending === 0) setSlow(false);
    }
  },
  /** Só para testes. */
  reset(): void {
    pending = 0;
    slow = false;
    listeners.clear();
  },
};
