'use client';

import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion } from 'motion/react';
import { useSyncExternalStore } from 'react';
import { serverWake } from '@/lib/server-wake';

/** Aviso amigável enquanto a API do plano gratuito "acorda" (pode levar até ~1 min). */
export function ServerWakeBanner() {
  const slow = useSyncExternalStore(serverWake.subscribe, serverWake.isSlow, () => false);

  return (
    <AnimatePresence>
      {slow && (
        <Paper
          component={motion.div}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            translate: '-50% 0',
            zIndex: 1400,
            px: 2.5,
            py: 1.5,
            borderRadius: 4,
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={18} thickness={5} />
            <div>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Acordando o servidor…
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No plano gratuito, a primeira resposta pode levar até 1 minuto.
              </Typography>
            </div>
          </Stack>
        </Paper>
      )}
    </AnimatePresence>
  );
}
