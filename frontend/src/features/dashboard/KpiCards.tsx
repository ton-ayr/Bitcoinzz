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
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { FocusGroup } from '@/components/FocusGroup';
import { StatCard } from '@/components/StatCard';
import { formatBRL, formatBTC, formatPercent } from '@/lib/format';
import { relativeTime } from '@/lib/time';
import { useNow } from '@/lib/use-now';
import { colors } from '@/theme/tokens';
import { useBalance, usePosition, useQuote, useVolume } from './queries';

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(35, 165, 90, 0.6); }
  70%  { box-shadow: 0 0 0 9px rgba(35, 165, 90, 0); }
  100% { box-shadow: 0 0 0 0 rgba(35, 165, 90, 0); }
`;

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

/** Chip verde/vermelho com a variação em %. Sem seta (`showIcon={false}`) quando falta espaço. */
export function VariationChip({
  value,
  size = 'small',
  showIcon = true,
}: {
  value: number;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}) {
  const up = value > 0;
  const down = value < 0;
  const arrow = up ? <ArrowUpwardRoundedIcon /> : down ? <ArrowDownwardRoundedIcon /> : undefined;
  return (
    <Chip
      size={size}
      color={up ? 'success' : down ? 'error' : 'default'}
      icon={showIcon ? arrow : undefined}
      label={formatPercent(value)}
    />
  );
}

// 4 cards lado a lado só com largura para eles (abaixo disso, 2 × 2); em 1200–1360 px os
// rótulos e a cotação ficavam espremidos.
const FOUR_COLUMNS = '@media (min-width: 1360px)';

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
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
        [FOUR_COLUMNS]: { gridTemplateColumns: 'repeat(4, 1fr)' },
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
        label="Posição"
        icon={<PieChartRoundedIcon />}
        badge={
          position.data && position.data.investments.length > 0 ? (
            <VariationChip value={position.data.summary.returnPercent} showIcon={false} />
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
