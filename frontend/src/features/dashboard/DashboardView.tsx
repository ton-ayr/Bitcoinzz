'use client';

import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useQuery } from '@tanstack/react-query';
import { motion, type Variants } from 'motion/react';
import NextLink from 'next/link';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { HistoryChart } from './HistoryChart';
import { KpiCards } from './KpiCards';
import { PositionsList } from './PositionsList';

// Blocos entram em sequência, de cima para baixo.
const container: Variants = { show: { transition: { staggerChildren: 0.09 } } };
const block: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function DashboardView() {
  const profile = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<{ name: string }>('account'),
  });
  const firstName = profile.data?.name.split(' ')[0];

  return (
    <Box component={motion.div} variants={container} initial="hidden" animate="show">
      <Box component={motion.div} variants={block}>
        <PageHeader
          title={firstName ? `Olá, ${firstName}!` : 'Dashboard'}
          subtitle="Acompanhe seu saldo, a cotação e seus investimentos em tempo real."
          actions={
            <FocusGroup sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                className={FOCUS_ITEM}
                component={NextLink}
                href="/deposit"
                variant="outlined"
                startIcon={<AddCardRoundedIcon />}
              >
                Depositar
              </Button>
              <Button
                className={FOCUS_ITEM}
                component={NextLink}
                href="/buy"
                variant="contained"
                startIcon={<CallMadeRoundedIcon />}
              >
                Comprar
              </Button>
              <Button
                className={FOCUS_ITEM}
                component={NextLink}
                href="/sell"
                variant="outlined"
                startIcon={<CallReceivedRoundedIcon />}
              >
                Vender
              </Button>
            </FocusGroup>
          }
        />
      </Box>

      <Box component={motion.div} variants={block} sx={{ mb: 3 }}>
        <KpiCards />
      </Box>
      <Box component={motion.div} variants={block} sx={{ mb: 3 }}>
        <HistoryChart />
      </Box>
      <Box component={motion.div} variants={block}>
        <PositionsList />
      </Box>
    </Box>
  );
}
