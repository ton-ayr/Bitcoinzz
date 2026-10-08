import { addDays, dayInSaoPaulo, daysBetween } from '@/lib/dates';
import { formatDate, formatTime } from '@/lib/format';
import { btcToSats, toCents } from '@/lib/money';
import type { StatementTransaction, TransactionType } from './types';

// ---------------------------------------------------------------- período

/** Atalhos de período. 90 dias é o padrão, igual ao da API (`DEFAULT_PERIOD_DAYS`). */
export const PERIOD_PRESETS = [7, 30, 90] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];
export const DEFAULT_PRESET: PeriodPreset = 90;

/** Mesmo limite da API (`MAX_PERIOD_DAYS`). */
const MAX_PERIOD_DAYS = 366;

export interface DateRange {
  from: string;
  to: string;
}

/** "Últimos N dias" com a mesma conta da API: de hoje − N até hoje. */
export function presetRange(days: number, today: string): DateRange {
  return { from: addDays(today, -days), to: today };
}

/** Valida o período com as mesmas regras e mensagens da API (null = válido). */
export function rangeError({ from, to }: DateRange): string | null {
  const days = daysBetween(from, to);
  if (days < 0) return 'A data inicial deve ser anterior ou igual à data final';
  // +1: os dois dias das pontas contam (de 07/10/2025 a 07/10/2026 são 366 dias).
  if (days + 1 > MAX_PERIOD_DAYS) return `O período máximo é de ${MAX_PERIOD_DAYS} dias`;
  return null;
}

// ---------------------------------------------------------------- tipos de lançamento

/** Como cada tipo aparece; `flow` diz se o saldo em R$ entra, sai ou não muda. */
export const TRANSACTION_TYPES: Record<
  TransactionType,
  { label: string; plural: string; flow: 'in' | 'out' | 'neutral' }
> = {
  DEPOSIT: { label: 'Depósito', plural: 'Depósitos', flow: 'in' },
  PURCHASE: { label: 'Compra de BTC', plural: 'Compras', flow: 'out' },
  SALE: { label: 'Venda de BTC', plural: 'Vendas', flow: 'in' },
  // A sobra da venda parcial continua investida: não mexe no saldo.
  REINVESTMENT: { label: 'Reinvestimento', plural: 'Reinvestimentos', flow: 'neutral' },
};

// ---------------------------------------------------------------- agrupamento e totais

export interface DayGroup {
  day: string;
  /** "Hoje", "Ontem" ou "05/10/2026". */
  label: string;
  items: StatementTransaction[];
}

/** Agrupa por dia (no horário de São Paulo), do mais recente para o mais antigo. */
export function groupByDay(transactions: StatementTransaction[], today: string): DayGroup[] {
  const sorted = [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const yesterday = addDays(today, -1);

  const groups: DayGroup[] = [];
  for (const transaction of sorted) {
    const day = dayInSaoPaulo(transaction.createdAt);
    let group = groups.at(-1);
    if (group?.day !== day) {
      const label = day === today ? 'Hoje' : day === yesterday ? 'Ontem' : formatDate(day);
      group = { day, label, items: [] };
      groups.push(group);
    }
    group.items.push(transaction);
  }
  return groups;
}

export interface PeriodTotals {
  depositedCents: number;
  purchasedCents: number;
  purchasedSats: number;
  soldCents: number;
  soldSats: number;
  counts: Record<TransactionType, number>;
}

/** Totais do período, em inteiros. Reinvestimentos só entram na contagem (não movem dinheiro). */
export function periodTotals(transactions: StatementTransaction[]): PeriodTotals {
  const totals: PeriodTotals = {
    depositedCents: 0,
    purchasedCents: 0,
    purchasedSats: 0,
    soldCents: 0,
    soldSats: 0,
    counts: { DEPOSIT: 0, PURCHASE: 0, SALE: 0, REINVESTMENT: 0 },
  };
  for (const { type, amount, btcAmount } of transactions) {
    totals.counts[type] += 1;
    const sats = btcAmount === null ? 0 : btcToSats(btcAmount);
    if (type === 'DEPOSIT') totals.depositedCents += toCents(amount);
    if (type === 'PURCHASE') {
      totals.purchasedCents += toCents(amount);
      totals.purchasedSats += sats;
    }
    if (type === 'SALE') {
      totals.soldCents += toCents(amount);
      totals.soldSats += sats;
    }
  }
  return totals;
}

// ---------------------------------------------------------------- CSV

const csvNumber = (digits: number) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  });
const csvMoney = csvNumber(2);
const csvBtc = csvNumber(8);

/**
 * Extrato em CSV para o Excel em português: separador ";" e vírgula decimal.
 * Os textos são fixos (tipos e números), então nenhuma célula precisa de aspas.
 */
export function toCsv(transactions: StatementTransaction[]): string {
  const header = ['Data', 'Hora', 'Tipo', 'Valor (R$)', 'BTC', 'Cotação (R$)'];
  const rows = transactions.map((transaction) => [
    formatDate(transaction.createdAt),
    formatTime(transaction.createdAt),
    TRANSACTION_TYPES[transaction.type].label,
    csvMoney.format(transaction.amount),
    transaction.btcAmount === null ? '' : csvBtc.format(transaction.btcAmount),
    transaction.btcPrice === null ? '' : csvMoney.format(transaction.btcPrice),
  ]);
  return [header, ...rows].map((row) => row.join(';')).join('\r\n');
}
