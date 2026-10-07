'use client';

import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { EmptyState } from '@/components/EmptyState';

/** Fronteira de erro das telas logadas: algo quebrou ao renderizar → mensagem + tentar de novo. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card sx={{ '&:hover': { transform: 'none' } }}>
      <EmptyState
        icon={<ErrorOutlineRoundedIcon />}
        title="Algo deu errado nesta tela"
        description="Tente de novo em instantes. Se continuar, recarregue a página."
        action={
          <Button variant="contained" onClick={reset}>
            Tentar de novo
          </Button>
        }
      />
    </Card>
  );
}
