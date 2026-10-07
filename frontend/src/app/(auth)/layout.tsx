import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { AuthHero } from '@/features/auth/AuthHero';

/** Login e cadastro: hero à esquerda (telas largas) e formulário à direita. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          p: { md: 6, lg: 10 },
        }}
      >
        <AuthHero />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: { xs: 6, md: 4 },
        }}
      >
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
          <Logo />
        </Box>
        <Box sx={{ width: '100%', maxWidth: 440 }}>{children}</Box>
      </Box>
    </Box>
  );
}
