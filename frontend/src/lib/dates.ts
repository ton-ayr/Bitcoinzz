/**
 * Datas "puras" (AAAA-MM-DD) no calendário de São Paulo, o mesmo que a API usa no extrato.
 * As contas são feitas em UTC sobre a data pura, então o fuso do navegador não interfere.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// O formato en-CA já sai como AAAA-MM-DD.
const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Dia em que um instante cai no horário de São Paulo ("2026-10-08T02:30Z" → "2026-10-07"). */
export function dayInSaoPaulo(date: Date | string): string {
  return dayFormat.format(new Date(date));
}

const toUtc = (day: string) => Date.parse(`${day}T00:00:00Z`);

/** Soma (ou subtrai) dias de uma data pura ("2026-10-07" − 90 → "2026-07-09"). */
export function addDays(day: string, days: number): string {
  return new Date(toUtc(day) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Quantos dias vão de `from` até `to` (negativo se `from` vier depois). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}
