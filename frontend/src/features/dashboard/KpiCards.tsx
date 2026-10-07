'use client';

import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CurrencyBitcoinRoundedIcon from '@mui/icons-material/CurrencyBitcoinRounded';
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { keyframes } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useSyncExternalStore } from 'react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { FocusGroup } from '@/components/FocusGroup';
import { StatCard } from '@/components/StatCard';
import { formatBRL, formatBTC, formatPercent } from '@/lib/format';
import { relativeTime } from '@/lib/time';
import { colors } from '@/theme/tokens';
import { useBalance, usePosition, useQuote, useVolume } from './queries';

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(35, 165, 90, 0.6); }
  70%  { box-shadow: 0 0 0 9px rgba(35, 165, 90, 0); }
  100% { box-shadow: 0 0 0 0 rgba(35, 165, 90, 0); }
`;

// Relógio que "anda" a cada segundo, só no navegador (para o "há 12 s" da cotação).
// No servidor (pré-renderização do Cache Components) devolve null: nenhuma data entra no HTML estático.
function subscribeToSeconds(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}
const currentSecond = () => Math.floor(Date.now() / 1000);
const noTimeOnServer = () => null;

function useNow(): Date | null {
  const second = useSyncExternalStore(subscribeToSeconds, currentSecond, noTimeOnServer);
  return second === null ? null : new Date(second * 1000);
}

function LiveBadge() {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: colors.success,
          animation: `${pulse} 2s infinite`,
        }}
      />
      <Typography variant="caption" color="text.secondary">
        ao vivo
      </Typography>
    </Stack>
  );
}

/** Chip verde/vermelho com a variação em %. */
export function VariationChip({
  value,
  size = 'small',
}: {
  value: number;
  size?: 'small' | 'medium';
}) {
  const up = value > 0;
  const down = value < 0;
  return (
    <Chip
      size={size}
      color={up ? 'success' : down ? 'error' : 'default'}
      icon={up ? <ArrowUpwardRoundedIcon /> : down ? <ArrowDownwardRoundedIcon /> : undefined}
      label={formatPercent(value)}
    />
  );
}

export function KpiCards() {
  const balance = useBalance();
  const quote = useQuote();
  const volume = useVolume();
  const position = usePosition();
  const now = useNow();

  return (
    <FocusGroup
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
      }}
    >
      <StatCard
        label="Saldo disponível"
        icon={<AccountBalanceWalletRoundedIcon />}
        loading={balance.isPending}
        error={balance.isError}
        onRetry={() => balance.refetch()}
        value={balance.data && <AnimatedNumber value={balance.data.balance} format={formatBRL} />}
        footer="Disponível para investir"
      />

      <StatCard
        label="Cotação BTC"
        icon={<CurrencyBitcoinRoundedIcon />}
        badge={quote.data && <LiveBadge />}
        loading={quote.isPending}
        error={quote.isError}
        onRetry={() => quote.refetch()}
        value={quote.data && <AnimatedNumber value={quote.data.sell} format={formatBRL} />}
        footer={
          quote.data && (
            <>
              Você compra por este valor e vende por {formatBRL(quote.data.buy)}
              {now && <> · atualizado {relativeTime(quote.data.updatedAt, now)}</>}
            </>
          )
        }
      />

      <StatCard
        label="Volume hoje"
        icon={<SwapVertRoundedIcon />}
        loading={volume.isPending}
        error={volume.isError}
        onRetry={() => volume.refetch()}
        value={volume.data && formatBTC(volume.data.bought)}
        footer={volume.data && <>Comprados hoje · vendidos: {formatBTC(volume.data.sold)}</>}
      />

      <StatCard
        label="Investimentos"
        icon={<PieChartRoundedIcon />}
        badge={
          position.data && position.data.investments.length > 0 ? (
            <VariationChip value={position.data.summary.returnPercent} />
          ) : undefined
        }
        loading={position.isPending}
        error={position.isError}
        onRetry={() => position.refetch()}
        value={
          position.data && (
            <AnimatedNumber value={position.data.summary.currentValue} format={formatBRL} />
          )
        }
        footer={
          position.data && (
            <>
              Investido {formatBRL(position.data.summary.invested)} ·{' '}
              {formatBTC(position.data.summary.btcAmount)}
            </>
          )
        }
      />
    </FocusGroup>
  );
}
