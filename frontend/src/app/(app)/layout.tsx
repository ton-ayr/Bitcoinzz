import { Suspense, type ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { UserBadge, UserBadgeSkeleton } from '@/components/UserBadge';

/**
 * Layout das telas logadas. O AppShell (menu) é Client Component; o UserBadge é Server Component
 * passado como "slot": o Next renderiza o menu na hora e o nome do usuário chega em streaming.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      user={
        <Suspense fallback={<UserBadgeSkeleton />}>
          <UserBadge />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
