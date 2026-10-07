/** Telas do menu lateral (o ícone de cada uma fica no AppShell). */
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/deposit', label: 'Depositar' },
  { href: '/buy', label: 'Comprar' },
  { href: '/sell', label: 'Vender' },
  { href: '/statement', label: 'Extrato' },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]['href'];

/** O item fica ativo na própria página e nas subpáginas (ex.: /statement/123). */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
