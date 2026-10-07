import { notFound } from 'next/navigation';
import { DesignPreview } from './DesignPreview';

export const metadata = { title: 'Design system', robots: { index: false } };

/** Prévia do design system: referência visual durante o desenvolvimento (404 em produção). */
export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <DesignPreview />;
}
