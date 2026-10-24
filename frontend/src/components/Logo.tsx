import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { colors, gradients } from '@/theme/tokens';

/** Marca: selo "₿" com o gradiente blurple + nome. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box
        aria-hidden
        sx={{
          width: size,
          height: size,
          borderRadius: `${size * 0.3}px`,
          display: 'grid',
          placeItems: 'center',
          backgroundImage: gradients.primary,
          fontWeight: 800,
          fontSize: size * 0.55,
          color: '#fff',
          boxShadow: `0 8px 24px -6px ${alpha(colors.blurple, 0.6)}`,
        }}
      >
        ₿
      </Box>
      <Typography variant="h6" component="span" sx={{ fontWeight: 800 }}>
        Bitcoinzz
      </Typography>
    </Stack>
  );
}
