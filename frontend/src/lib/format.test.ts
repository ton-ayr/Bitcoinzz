import { describe, expect, it } from 'vitest';
import {
  formatBRL,
  formatBTC,
  formatDate,
  formatDateTime,
  formatPercent,
  formatTime,
} from './format';

// O Intl usa espaço não separável (U+00A0) em "R$ 1,00"; normalizamos para comparar.
const normalize = (text: string) => text.replace(/ /g, ' ');

describe('format', () => {
  it('R$ no padrão brasileiro', () => {
    expect(normalize(formatBRL(1250.5))).toBe('R$ 1.250,50');
    expect(normalize(formatBRL(0))).toBe('R$ 0,00');
    expect(normalize(formatBRL(427253))).toBe('R$ 427.253,00');
  });

  it('BTC sempre com 8 casas', () => {
    expect(formatBTC(0.00058381)).toBe('₿ 0,00058381');
    expect(formatBTC(1)).toBe('₿ 1,00000000');
  });

  it('percentual com sinal (zero sem sinal)', () => {
    expect(normalize(formatPercent(25))).toBe('+25,00%');
    expect(normalize(formatPercent(-16.67))).toBe('-16,67%');
    expect(normalize(formatPercent(0))).toBe('0,00%');
  });

  it('data e hora no horário de São Paulo', () => {
    // 01:30 UTC do dia 07 = 22:30 do dia 06 em São Paulo
    expect(normalize(formatDateTime('2026-10-07T01:30:00Z'))).toBe('06/10/2026, 22:30');
    expect(formatTime('2026-10-07T01:30:00Z')).toBe('22:30');
  });

  it('data pura da API não "volta um dia" por causa do fuso', () => {
    expect(formatDate('2026-10-06')).toBe('06/10/2026');
    expect(formatDate('2026-10-07T01:30:00Z')).toBe('06/10/2026');
  });
});
