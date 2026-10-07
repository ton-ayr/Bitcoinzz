'use client';

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { FOCUS_ITEM } from '@/components/FocusGroup';
import { colors } from '@/theme/tokens';

interface StatCardProps {
  label: string;
  icon: ReactNode;
  /** Canto superior direito (ex.: indicador "ao vivo"). */
  badge?: ReactNode;
  value: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

/** Card de indicador do dashboard, com estados de carregando e de erro. Participa do FocusGroup. */
export function StatCard({
  label,
  icon,
  badge,
  value,
  footer,
  loading,
  error,
  onRetry,
}: StatCardProps) {
  return (
    <Card className={FOCUS_ITEM} sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(88, 101, 242, 0.16)',
            color: colors.blurpleLight,
            '& svg': { fontSize: 20 },
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ flexGrow: 1, minWidth: 0, lineHeight: 1.4 }}
        >
          {label}
        </Typography>
        {badge && <Box sx={{ flexShrink: 0 }}>{badge}</Box>}
      </Stack>

      {loading ? (
        <>
          <Skeleton width="70%" height={40} />
          <Skeleton width="45%" />
        </>
      ) : error ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography color="text.secondary">Não foi possível carregar.</Typography>
          {onRetry && (
            <IconButton
              size="small"
              onClick={onRetry}
              aria-label={`Tentar carregar ${label} de novo`}
            >
              <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      ) : (
        <>
          <Typography variant="h5" component="p" sx={{ fontWeight: 800 }}>
            {value}
          </Typography>
          {footer && (
            <Box sx={{ mt: 1, color: 'text.secondary', typography: 'body2' }}>{footer}</Box>
          )}
        </>
      )}
    </Card>
  );
}
