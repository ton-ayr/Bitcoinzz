import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata = { title: 'Entrar' };

export default function LoginPage() {
  // O formulário lê a URL (?next=, ?reason=): com Cache Components, isso fica dentro de <Suspense>.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
