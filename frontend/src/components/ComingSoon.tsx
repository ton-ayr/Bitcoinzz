import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import Card from '@mui/material/Card';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

/** PROVISÓRIO: telas que chegam nas Fases 14 e 15 (evita 404 nos links do menu). */
export function ComingSoon({ title, phase }: { title: string; phase: number }) {
  return (
    <>
      <PageHeader title={title} />
      <Card sx={{ '&:hover': { transform: 'none' } }}>
        <EmptyState
          icon={<ConstructionRoundedIcon />}
          title="Em construção"
          description={`Esta tela chega na Fase ${phase} do roadmap.`}
        />
      </Card>
    </>
  );
}
