import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export const metadata = { title: 'Criar conta' };

// PROVISÓRIO (Fase 11): a tela de cadastro completa chega na Fase 12.
export default function RegisterPage() {
  return (
    <Container maxWidth="xs" sx={{ py: 12 }}>
      <Card sx={{ p: 4 }}>
        <Typography variant="h5">Criar conta</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          A tela de cadastro chega na Fase 12.
        </Typography>
      </Card>
    </Container>
  );
}
