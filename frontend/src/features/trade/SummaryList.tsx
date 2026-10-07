import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { colors } from '@/theme/tokens';

export interface SummaryRow {
  label: string;
  value: ReactNode;
  /** Linha principal da lista (valor maior). */
  emphasis?: boolean;
}

/** Lista "rótulo → valor" da prévia, da confirmação e do resultado das operações. */
export function SummaryList({ rows }: { rows: SummaryRow[] }) {
  return (
    <Box component="dl" sx={{ m: 0 }}>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 2,
            py: 1.25,
            borderBottom: `1px solid ${colors.border}`,
            '&:last-of-type': { borderBottom: 0 },
          }}
        >
          <Typography component="dt" variant="body2" color="text.secondary">
            {row.label}
          </Typography>
          <Typography
            component="dd"
            sx={{
              m: 0,
              textAlign: 'right',
              fontWeight: row.emphasis ? 800 : 600,
              fontSize: row.emphasis ? '1.125rem' : undefined,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
