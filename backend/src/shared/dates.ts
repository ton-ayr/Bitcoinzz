import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Fuso usado para "dia corrente", extrato e histórico. */
export const APP_TIMEZONE = 'America/Sao_Paulo';

export const TEN_MINUTES_MS = 10 * 60 * 1000;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 00:00:00.000 do dia de `date`, no horário de São Paulo. */
export function startOfDay(date: Date = new Date()): Date {
  return dayjs(date).tz(APP_TIMEZONE).startOf('day').toDate();
}

/** 23:59:59.999 do dia de `date`, no horário de São Paulo. */
export function endOfDay(date: Date = new Date()): Date {
  return dayjs(date).tz(APP_TIMEZONE).endOf('day').toDate();
}

export function subtractDays(date: Date, days: number): Date {
  return dayjs(date).tz(APP_TIMEZONE).subtract(days, 'day').toDate();
}

/** "2026-10-06" → início desse dia em São Paulo. Lança erro se a data não existir. */
export function parseDateOnly(value: string): Date {
  const parsed = DATE_ONLY_PATTERN.test(value) ? dayjs.tz(value, APP_TIMEZONE) : null;

  if (!parsed?.isValid() || parsed.format('YYYY-MM-DD') !== value) {
    throw new RangeError(`Data inválida: "${value}" (use o formato AAAA-MM-DD)`);
  }
  return parsed.toDate();
}

/** Data → "AAAA-MM-DD" no horário de São Paulo. */
export function toDateOnly(date: Date): string {
  return dayjs(date).tz(APP_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Arredonda para baixo até o múltiplo de 10 minutos (08:17 → 08:10).
 * Funciona em UTC porque o fuso de São Paulo tem deslocamento em horas inteiras.
 */
export function floorToTenMinutes(date: Date): Date {
  return new Date(Math.floor(date.getTime() / TEN_MINUTES_MS) * TEN_MINUTES_MS);
}

/** Os últimos `count` horários de 10 em 10 minutos até `now`, em ordem crescente. */
export function lastTenMinuteSlots(now: Date, count: number): Date[] {
  const latest = floorToTenMinutes(now).getTime();
  return Array.from(
    { length: count },
    (_, index) => new Date(latest - (count - 1 - index) * TEN_MINUTES_MS),
  );
}
