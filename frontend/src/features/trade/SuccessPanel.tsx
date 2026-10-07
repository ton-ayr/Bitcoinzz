'use client';

import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { FocusGroup } from '@/components/FocusGroup';
import { colors } from '@/theme/tokens';
import { SummaryList, type SummaryRow } from './SummaryList';

interface SuccessPanelProps {
  title: string;
  description?: string;
  /** Resultado real devolvido pela API (não a estimativa). */
  rows: SummaryRow[];
  /** Botões com `className={FOCUS_ITEM}`. */
  actions: ReactNode;
}

/** Resumo de sucesso que substitui o formulário depois de uma operação. */
export function SuccessPanel({ title, description, rows, actions }: SuccessPanelProps) {
  return (
    <Card
      component={motion.section}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        p: { xs: 3, sm: 4 },
        maxWidth: 560,
        mx: 'auto',
        textAlign: 'center',
        '&:hover': { transform: 'none' },
      }}
    >
      <Box
        component={motion.div}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
        sx={{
          width: 72,
          height: 72,
          mx: 'auto',
          mb: 2,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: colors.success,
          bgcolor: alpha(colors.success, 0.16),
          boxShadow: `0 0 0 10px ${alpha(colors.success, 0.06)}`,
        }}
      >
        <CheckRoundedIcon sx={{ fontSize: 40 }} />
      </Box>

      <Typography variant="h5" component="h2">
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}

      <Box sx={{ textAlign: 'left', my: 3 }}>
        <SummaryList rows={rows} />
      </Box>

      <FocusGroup sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {actions}
      </FocusGroup>
    </Card>
  );
}
