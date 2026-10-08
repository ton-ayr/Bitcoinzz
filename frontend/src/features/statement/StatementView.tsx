'use client';

import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import NextLink from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { downloadTextFile } from '@/lib/download';
import { formatBRL, formatBTC } from '@/lib/format';
import { errorMessage } from '@/lib/http';
import { satsToBtc, toReais } from '@/lib/money';
import { useToday } from '@/lib/use-now';
import { useStatement } from './queries';
import {
  DEFAULT_PRESET,
  groupByDay,
  periodTotals,
  presetRange,
  rangeError,
  toCsv,
  TRANSACTION_TYPES,
  type DateRange,
  type PeriodPreset,
} from './statement';
import { StatementFilters } from './StatementFilters';
import { StatementList } from './StatementList';
import type { TransactionType } from './types';

type Period = { preset: PeriodPreset } | { preset: null; range: DateRange };
type TypeFilter = TransactionType | 'ALL';

const TYPE_FILTERS = Object.keys(TRANSACTION_TYPES) as TransactionType[];
const PANEL_SX = { p: { xs: 2, sm: 3 }, '&:hover': { transform: 'none' } } as const;

const brl = (cents: number) => formatBRL(toReais(cents));
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export function StatementView() {
  // "Hoje" só existe no navegador (null na pré-renderização): o período depende dele.
  const today = useToday();
  const [period, setPeriod] = useState<Period>({ preset: DEFAULT_PRESET });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  const range =
    period.preset === null ? period.range : today ? presetRange(period.preset, today) : null;
  const invalid = range ? rangeError(range) : null;
  const statement = useStatement(range && !invalid ? range : null);

  const transactions = statement.data?.transactions ?? [];
  const totals = periodTotals(transactions);
  const visible =
    typeFilter === 'ALL' ? transactions : transactions.filter((item) => item.type === typeFilter);
  const loading = statement.isPending && !invalid;

  function exportCsv() {
    if (!range) return;
    downloadTextFile(`extrato-bitcoinzz-${range.from}-a-${range.to}.csv`, toCsv(visible));
  }

  const filterChip = (value: TypeFilter, label: string, count: number) => (
    <Chip
      key={value}
      className={FOCUS_ITEM}
      label={`${label} (${count})`}
      color={typeFilter === value ? 'primary' : 'default'}
      variant={typeFilter === value ? 'filled' : 'outlined'}
      aria-pressed={typeFilter === value}
      onClick={() => setTypeFilter(value)}
    />
  );

  let content;
  if (loading) {
    content = (
      <Stack spacing={1.5} sx={{ py: 1 }}>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} variant="rounded" height={56} />
        ))}
      </Stack>
    );
  } else if (statement.isError) {
    content = (
      <EmptyState
        icon={<ReceiptLongRoundedIcon />}
        title="Não foi possível carregar o extrato"
        description={errorMessage(statement.error)}
        action={
          <Button variant="outlined" onClick={() => statement.refetch()}>
            Tentar de novo
          </Button>
        }
      />
    );
  } else if (transactions.length === 0) {
    content = (
      <EmptyState
        icon={<ReceiptLongRoundedIcon />}
        title="Nenhuma movimentação no período"
        description="Escolha um período maior ou faça o seu primeiro depósito."
        action={
          <Button component={NextLink} href="/deposit" variant="contained">
            Depositar
          </Button>
        }
      />
    );
  } else if (visible.length === 0) {
    content = (
      <EmptyState
        icon={<ReceiptLongRoundedIcon />}
        title="Nada deste tipo no período"
        description="Escolha outro tipo de lançamento ou um período maior."
        action={
          <Button variant="outlined" onClick={() => setTypeFilter('ALL')}>
            Ver todos
          </Button>
        }
      />
    );
  } else {
    content = <StatementList groups={groupByDay(visible, today ?? '')} />;
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <PageHeader
        title="Extrato"
        subtitle="Depósitos, compras, vendas e reinvestimentos, com datas e cotações."
        actions={
          <Button
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            onClick={exportCsv}
            disabled={visible.length === 0}
          >
            Exportar CSV
          </Button>
        }
      />

      <Card sx={{ ...PANEL_SX, mb: 3 }}>
        {range && today ? (
          <StatementFilters
            range={range}
            preset={period.preset}
            today={today}
            error={invalid}
            onPreset={(preset) => setPeriod({ preset })}
            onRangeChange={(next) => setPeriod({ preset: null, range: next })}
          />
        ) : (
          <Skeleton variant="rounded" height={40} />
        )}
      </Card>

      <FocusGroup
        sx={{
          display: 'grid',
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <StatCard
          label="Depositado"
          icon={<AddCardRoundedIcon />}
          loading={loading}
          value={brl(totals.depositedCents)}
          footer={plural(totals.counts.DEPOSIT, 'depósito', 'depósitos')}
        />
        <StatCard
          label="Comprado"
          icon={<CallMadeRoundedIcon />}
          loading={loading}
          value={brl(totals.purchasedCents)}
          footer={`${formatBTC(satsToBtc(totals.purchasedSats))} em ${plural(totals.counts.PURCHASE, 'compra', 'compras')}`}
        />
        <StatCard
          label="Vendido"
          icon={<CallReceivedRoundedIcon />}
          loading={loading}
          value={brl(totals.soldCents)}
          footer={`${formatBTC(satsToBtc(totals.soldSats))} em ${plural(totals.counts.SALE, 'venda', 'vendas')}`}
        />
      </FocusGroup>

      <Card sx={PANEL_SX}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}
        >
          <Typography variant="h6" component="h2">
            Movimentações
          </Typography>
          <FocusGroup
            role="group"
            aria-label="Tipo de lançamento"
            sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
          >
            {filterChip('ALL', 'Todos', transactions.length)}
            {TYPE_FILTERS.map((type) =>
              filterChip(type, TRANSACTION_TYPES[type].plural, totals.counts[type]),
            )}
          </FocusGroup>
        </Stack>
        {/* Enquanto o período novo carrega, o anterior fica mais apagado. */}
        <Box sx={{ opacity: statement.isPlaceholderData ? 0.5 : 1, transition: 'opacity 200ms' }}>
          {content}
        </Box>
      </Card>
    </Box>
  );
}
