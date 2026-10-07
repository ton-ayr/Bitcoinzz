import { redirect } from 'next/navigation';

/** A raiz não tem conteúdo: o proxy.ts manda para o dashboard ou para o login. */
export default function Home() {
  redirect('/dashboard');
}
