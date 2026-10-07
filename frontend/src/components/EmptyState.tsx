import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { colors } from '@/theme/tokens';

/** Estado vazio amigável: ícone, título, explicação e uma ação (ex.: "Comprar bitcoin"). */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 5, px: 2 }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 4,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(88, 101, 242, 0.14)',
          color: colors.blurpleLight,
          '& svg': { fontSize: 28 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ pt: 1 }}>{action}</Box>}
    </Stack>
  );
}
