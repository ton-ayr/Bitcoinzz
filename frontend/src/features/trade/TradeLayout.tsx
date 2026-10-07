'use client';

import Box from '@mui/material/Box';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/** Cards grandes das telas de operação: sem o "levantar" do hover (o conteúdo é interativo). */
export const PANEL_SX = { p: { xs: 2.5, sm: 3 }, '&:hover': { transform: 'none' } } as const;

/**
 * Formulário à esquerda e prévia à direita (empilhados no celular).
 * Fica fora do FocusGroup de propósito: a prévia precisa continuar nítida enquanto se digita.
 */
export function TradeLayout({ form, summary }: { form: ReactNode; summary: ReactNode }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'start',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 3fr) minmax(0, 2fr)' },
      }}
    >
      {form}
      {summary}
    </Box>
  );
}
