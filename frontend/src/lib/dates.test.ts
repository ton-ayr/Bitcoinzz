import { describe, expect, it } from 'vitest';
import { addDays, dayInSaoPaulo, daysBetween } from './dates';

describe('datas puras no calendário de São Paulo', () => {
  it('dia de um instante no horário de São Paulo (UTC−3)', () => {
    expect(dayInSaoPaulo('2026-10-07T15:00:00Z')).toBe('2026-10-07');
    // 02:30 UTC do dia 8 ainda é 23:30 do dia 7 em São Paulo
    expect(dayInSaoPaulo('2026-10-08T02:30:00Z')).toBe('2026-10-07');
  });

  it('soma e subtrai dias atravessando meses e anos', () => {
    expect(addDays('2026-10-07', -90)).toBe('2026-07-09');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29'); // ano bissexto
  });

  it('dias entre duas datas', () => {
    expect(daysBetween('2026-07-09', '2026-10-07')).toBe(90);
    expect(daysBetween('2026-10-07', '2026-10-01')).toBe(-6);
  });
});
