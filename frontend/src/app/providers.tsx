'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ServerWakeBanner } from '@/components/ServerWakeBanner';
import { theme } from '@/theme/theme';
import { colors } from '@/theme/tokens';

/** Tudo o que precisa rodar no navegador e envolver a aplicação inteira. */
export function Providers({ children }: { children: ReactNode }) {
  // Um QueryClient por navegador (criado uma vez, não a cada render).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, refetchOnWindowFocus: true, retry: 1 },
        },
      }),
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {/* "user": respeita a preferência do sistema por menos movimento. */}
        <MotionConfig reducedMotion="user">
          <AnimatedBackground />
          {children}
          <ServerWakeBanner />
          <Toaster
            theme="dark"
            position="top-right"
            richColors
            toastOptions={{
              style: {
                background: 'rgba(22, 23, 29, 0.85)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${colors.border}`,
                fontFamily: 'var(--font-jakarta)',
              },
            }}
          />
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
