import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatBRL, formatBTC, formatDateTime } from '@/lib/format';
import { satsToBtc, satsToCents, toReais } from '@/lib/money';
import { colors } from '@/theme/tokens';
import type { SaleStep } from './sale-preview';

const brl = (cents: number) => formatBRL(toReais(cents));
const btc = (sats: number) => formatBTC(satsToBtc(sats));

/** Mostra, na ordem FIFO, o que a venda faz com cada investimento. */
export function FifoPlan({ steps }: { steps: SaleStep[] }) {
  const affected = steps.filter((step) => step.kind !== 'KEPT');
  const kept = steps.length - affected.length;

  return (
    <Stack spacing={1}>
      <Box
        component="ol"
        aria-label="Investimentos usados na venda"
        sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1 }}
      >
        {affected.map(({ investment, kind, soldSats, leftoverSats }, index) => (
          <Box
            component="li"
            key={investment.id}
            sx={{
              p: 1.5,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              bgcolor: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {index + 1}º · compra de {formatDateTime(investment.purchasedAt)}
              </Typography>
              <Chip
                size="small"
                variant={kind === 'SOLD' ? 'filled' : 'outlined'}
                color={kind === 'SOLD' ? 'primary' : 'warning'}
                label={kind === 'SOLD' ? 'Vendido inteiro' : 'Venda parcial'}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {brl(investment.investedCents)} investidos a {brl(investment.purchasePriceCents)} ·
              vende {btc(soldSats)}
            </Typography>
            {kind === 'PARTIAL' && (
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.5, color: colors.blurpleLight }}
              >
                Sobra {btc(leftoverSats)} → reinvestimento de{' '}
                {brl(satsToCents(leftoverSats, investment.purchasePriceCents))}, com a mesma data e
                cotação da compra
              </Typography>
            )}
          </Box>
        ))}
      </Box>
      {kept > 0 && (
        <Typography variant="caption" color="text.secondary">
          {kept === 1
            ? '1 investimento mais novo continua aberto.'
            : `${kept} investimentos mais novos continuam abertos.`}
        </Typography>
      )}
    </Stack>
  );
}
