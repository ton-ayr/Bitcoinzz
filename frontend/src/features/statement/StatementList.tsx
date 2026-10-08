import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { formatBRL, formatBTC, formatTime } from '@/lib/format';
import { colors, motionTokens } from '@/theme/tokens';
import { TRANSACTION_TYPES, type DayGroup } from './statement';
import type { StatementTransaction, TransactionType } from './types';

// Mesmos ícones do menu (Depositar, Comprar, Vender).
const ICONS: Record<TransactionType, ReactNode> = {
  DEPOSIT: <AddCardRoundedIcon />,
  PURCHASE: <CallMadeRoundedIcon />,
  SALE: <CallReceivedRoundedIcon />,
  REINVESTMENT: <AutorenewRoundedIcon />,
};

const FLOW_COLOR = {
  in: colors.success,
  out: colors.blurpleLight,
  neutral: colors.textSecondary,
} as const;

function StatementRow({ transaction }: { transaction: StatementTransaction }) {
  const { label, flow } = TRANSACTION_TYPES[transaction.type];
  const amount = formatBRL(transaction.amount);
  // Entrada "+", saída "−"; reinvestimento sem sinal (o saldo não muda).
  const signed = flow === 'in' ? `+ ${amount}` : flow === 'out' ? `− ${amount}` : amount;
  const time = formatTime(transaction.createdAt);
  const detail =
    transaction.btcAmount !== null && transaction.btcPrice !== null
      ? `${formatBTC(transaction.btcAmount)} a ${formatBRL(transaction.btcPrice)} · ${time}`
      : time;

  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1.5,
        px: 1,
        borderRadius: '12px',
        transition: `background-color ${motionTokens.fast} ${motionTokens.easing}`,
        '&:hover': { bgcolor: alpha(colors.blurple, 0.07) },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '12px',
          display: 'grid',
          placeItems: 'center',
          color: FLOW_COLOR[flow],
          bgcolor: alpha(FLOW_COLOR[flow], 0.14),
          '& svg': { fontSize: 20 },
        }}
      >
        {ICONS[transaction.type]}
      </Box>
      {/* Valor na linha do título: a descrição usa a largura toda (no celular não fica espremida). */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
          <Typography
            sx={{
              fontWeight: 700,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
              color:
                flow === 'in' ? colors.success : flow === 'out' ? 'text.primary' : 'text.secondary',
            }}
          >
            {signed}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {detail}
          {transaction.type === 'REINVESTMENT' && ' · sobra da venda, com a cotação original'}
        </Typography>
      </Box>
    </Box>
  );
}

/** Lançamentos agrupados por dia, estilo app de banco ("Hoje", "Ontem", "05/10/2026"). */
export function StatementList({ groups }: { groups: DayGroup[] }) {
  return (
    <Stack spacing={2.5}>
      {groups.map((group) => (
        <Box component="section" key={group.day} aria-label={group.label}>
          <Typography variant="overline" component="h3" color="text.secondary" sx={{ px: 1 }}>
            {group.label}
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {group.items.map((transaction) => (
              <StatementRow key={transaction.id} transaction={transaction} />
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
