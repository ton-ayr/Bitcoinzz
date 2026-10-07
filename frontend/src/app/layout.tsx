import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';

// next/font baixa a fonte no build e a serve do próprio site (sem requisição ao Google no navegador).
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: { default: 'Bitcoinzz', template: '%s · Bitcoinzz' },
  description: 'Plataforma simulada de investimento em bitcoin.',
};

export const viewport: Viewport = {
  themeColor: '#0B0C10',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body>
        {/* Faz o CSS do MUI (Emotion) funcionar com a renderização no servidor do Next. */}
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
