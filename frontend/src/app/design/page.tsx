import { notFound } from 'next/navigation';
import { DesignPreview } from './DesignPreview';

const isProduction = process.env.NODE_ENV === 'production';

// Em produção a página não existe: o título também precisa ser o da 404, e não "Design system".
export const metadata = {
  title: isProduction ? 'Página não encontrada' : 'Design system',
  robots: { index: false },
};

/** Prévia do design system: referência visual durante o desenvolvimento (404 em produção). */
export default function DesignPage() {
  if (isProduction) notFound();
  return <DesignPreview />;
}
