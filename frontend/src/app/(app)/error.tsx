'use client';

import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { EmptyState } from '@/components/EmptyState';

/**
 * Fronteira de erro das telas logadas: algo quebrou ao renderizar → mensagem + tentar de novo.
 * `retry` (Next 16.4) busca a tela de novo e redesenha; `reset` só redesenharia sem buscar.
 */
export default function AppError({ retry }: { error: Error; retry: () => void }) {
  return (
    <Card sx={{ '&:hover': { transform: 'none' } }}>
      <EmptyState
        icon={<ErrorOutlineRoundedIcon />}
        title="Algo deu errado nesta tela"
        description="Tente de novo em instantes. Se continuar, recarregue a página."
        action={
          <Button variant="contained" onClick={() => retry()}>
            Tentar de novo
          </Button>
        }
      />
    </Card>
  );
}
