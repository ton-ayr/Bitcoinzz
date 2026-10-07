'use client';

// PROVISÓRIO (Fase 11): valida a sessão pelo BFF. O dashboard completo chega na Fase 13.

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface Profile {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const profile = useQuery({ queryKey: ['profile'], queryFn: () => api.get<Profile>('account') });

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Recarga completa: nenhum dado da sessão anterior fica na memória (ver lib/api-client.ts).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/login');
  }

  return (
    <Container maxWidth="sm" sx={{ py: 12 }}>
      <Card sx={{ p: 4 }}>
        <Typography variant="h5">
          {profile.data ? `Olá, ${profile.data.name}!` : 'Carregando…'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Sessão ativa pelo BFF. O dashboard completo chega na Fase 13.
        </Typography>
        <Button variant="outlined" onClick={logout}>
          Sair
        </Button>
      </Card>
    </Container>
  );
}
