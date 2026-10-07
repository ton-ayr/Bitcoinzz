/** Formatação para a interface (pt-BR). Datas sempre no horário de São Paulo, como a API. */

const TIME_ZONE = 'America/Sao_Paulo';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const btc = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
});
const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: TIME_ZONE });
const time = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});

/** 1250.5 → "R$ 1.250,50" */
export function formatBRL(value: number): string {
  return brl.format(value);
}

/** 0.00058381 → "₿ 0,00058381" */
export function formatBTC(value: number): string {
  return `₿ ${btc.format(value)}`;
}

/** 25 → "+25,00%"; −16.67 → "-16,67%"; 0 → "0,00%" */
export function formatPercent(value: number): string {
  return percent.format(value / 100);
}

/** ISO da API → "06/10/2026, 14:35" */
export function formatDateTime(iso: string | Date): string {
  return dateTime.format(new Date(iso));
}

/**
 * "2026-10-06" (data pura da API) → "06/10/2026".
 * Datas puras não passam pelo `Date`: "2026-10-06" viraria meia-noite UTC = dia 05 em São Paulo.
 */
export function formatDate(value: string | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  return date.format(new Date(value));
}

/** ISO → "14:30" (eixo do gráfico do histórico) */
export function formatTime(iso: string | Date): string {
  return time.format(new Date(iso));
}
