'use client';

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';

/**
 * Número que "conta" até o valor novo (ex.: o saldo depois de um depósito).
 * Usa um MotionValue: o texto muda a cada quadro sem re-renderizar o componente.
 */
export function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  /** Deve ser uma função estável (ex.: `formatBRL`), definida fora do componente. */
  format: (value: number) => string;
}) {
  const reduceMotion = useReducedMotion();
  const current = useMotionValue(0);
  const text = useTransform(current, (latest) => format(latest));

  useEffect(() => {
    const controls = animate(current, value, {
      duration: reduceMotion ? 0 : 0.9,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [current, value, reduceMotion]);

  return <motion.span>{text}</motion.span>;
}
