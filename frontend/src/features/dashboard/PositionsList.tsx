'use client';

import CurrencyBitcoinRoundedIcon from '@mui/icons-material/CurrencyBitcoinRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import NextLink from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { formatBRL, formatBTC, formatDateTime } from '@/lib/format';
import { VariationChip } from './KpiCards';
import { usePosition } from './queries';
import type { PositionItem } from './types';

function OriginChip({ origin }: { origin: PositionItem['origin'] }) {
  return origin === 'REINVESTMENT' ? (
    <Chip size="small" variant="outlined" label="Reinvestimento" />
  ) : null;
}

/** Celular: um card por investimento (tabela não cabe). */
function PositionCards({ items }: { items: PositionItem[] }) {
  return (
    <FocusGroup sx={{ display: 'grid', gap: 1.5 }}>
      {items.map((item) => (
        <Card key={item.id} className={FOCUS_ITEM} sx={{ p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(item.purchasedAt)}
            </Typography>
            <VariationChip value={item.priceVariationPercent} />
          </Stack>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {formatBRL(item.currentValue)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Investido {formatBRL(item.investedAmount)} · {formatBTC(item.btcAmount)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Cotação na compra {formatBRL(item.btcPriceAtPurchase)}
            </Typography>
            <OriginChip origin={item.origin} />
          </Stack>
        </Card>
      ))}
    </FocusGroup>
  );
}

function PositionTable({ items }: { items: PositionItem[] }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="medium" aria-label="Posição dos investimentos">
        <TableHead>
          <TableRow>
            <TableCell>Data da compra</TableCell>
            <TableCell align="right">Valor investido</TableCell>
            <TableCell align="right">BTC</TableCell>
            <TableCell align="right">Cotação na compra</TableCell>
            <TableCell align="right">Variação</TableCell>
            <TableCell align="right">Valor bruto atual</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <span>{formatDateTime(item.purchasedAt)}</span>
                  <OriginChip origin={item.origin} />
                </Stack>
              </TableCell>
              <TableCell align="right">{formatBRL(item.investedAmount)}</TableCell>
              <TableCell align="right">{formatBTC(item.btcAmount)}</TableCell>
              <TableCell align="right">{formatBRL(item.btcPriceAtPurchase)}</TableCell>
              <TableCell align="right">
                <VariationChip value={item.priceVariationPercent} />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatBRL(item.currentValue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/** Posição dos investimentos (item 7 do desafio): tabela no desktop, cards no celular. */
export function PositionsList() {
  const position = usePosition();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const items = position.data?.investments ?? [];

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, '&:hover': { transform: 'none' } }}>
      <Typography variant="h6" component="h2">
        Meus investimentos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Na venda, os investimentos mais antigos são usados primeiro (FIFO).
      </Typography>

      {position.isPending ? (
        <Stack spacing={1}>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} variant="rounded" height={48} />
          ))}
        </Stack>
      ) : position.isError ? (
        <Typography color="text.secondary">Não foi possível carregar os investimentos.</Typography>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CurrencyBitcoinRoundedIcon />}
          title="Você ainda não tem bitcoins"
          description="Faça um depósito e compre sua primeira fração de bitcoin. Ela aparece aqui com a variação em tempo real."
          action={
            <Button component={NextLink} href="/buy" variant="contained">
              Comprar bitcoin
            </Button>
          }
        />
      ) : isMobile ? (
        <PositionCards items={items} />
      ) : (
        <PositionTable items={items} />
      )}
    </Card>
  );
}
