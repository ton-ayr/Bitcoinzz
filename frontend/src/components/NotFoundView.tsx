'use client';

import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import NextLink from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { Logo } from '@/components/Logo';

/** Página 404 no visual do app. "Voltar para o início" leva ao dashboard ou ao login (proxy). */
export function NotFoundView() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        px: 2,
        py: 6,
      }}
    >
      <Logo />
      <Card sx={{ width: '100%', maxWidth: 480, '&:hover': { transform: 'none' } }}>
        <EmptyState
          icon={<SearchOffRoundedIcon />}
          title="Página não encontrada"
          description="O endereço pode estar errado ou a página não existe mais."
          action={
            <Button component={NextLink} href="/" variant="contained">
              Voltar para o início
            </Button>
          }
        />
      </Card>
    </Box>
  );
}
