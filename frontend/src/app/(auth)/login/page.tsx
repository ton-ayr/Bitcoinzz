import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export const metadata = { title: 'Entrar' };

// PROVISÓRIO (Fase 11): a tela de login completa chega na Fase 12.
export default function LoginPage() {
  return (
    <Container maxWidth="xs" sx={{ py: 12 }}>
      <Card sx={{ p: 4 }}>
        <Typography variant="h5">Entrar</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          A tela de login chega na Fase 12.
        </Typography>
      </Card>
    </Container>
  );
}
