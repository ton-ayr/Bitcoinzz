import { describe, expect, it } from 'vitest';
import {
  endOfDay,
  floorToTenMinutes,
  lastTenMinuteSlots,
  parseDateOnly,
  startOfDay,
  subtractDays,
  toDateOnly,
} from '../../src/shared/dates.js';

// São Paulo está em UTC-3 (sem horário de verão desde 2019).
describe('dates', () => {
  describe('startOfDay / endOfDay (fuso de São Paulo)', () => {
    it('usa a meia-noite de São Paulo, não a de UTC', () => {
      // 01:30 UTC do dia 7 ainda é 22:30 do dia 6 em São Paulo
      const date = new Date('2026-10-07T01:30:00Z');
      expect(startOfDay(date).toISOString()).toBe('2026-10-06T03:00:00.000Z');
      expect(endOfDay(date).toISOString()).toBe('2026-10-07T02:59:59.999Z');
    });
  });

  describe('parseDateOnly / toDateOnly', () => {
    it('interpreta AAAA-MM-DD como início do dia em São Paulo', () => {
      expect(parseDateOnly('2026-10-06').toISOString()).toBe('2026-10-06T03:00:00.000Z');
    });

    it('formata no dia de São Paulo', () => {
      expect(toDateOnly(new Date('2026-10-07T01:30:00Z'))).toBe('2026-10-06');
    });

    it.each(['06/10/2026', '2026-13-01', '2026-02-30', '2026-1-5', ''])(
      'rejeita data inválida: "%s"',
      (value) => {
        expect(() => parseDateOnly(value)).toThrow(RangeError);
      },
    );
  });

  it('subtractDays volta N dias', () => {
    const date = new Date('2026-10-06T15:00:00Z');
    expect(toDateOnly(subtractDays(date, 90))).toBe('2026-07-08');
  });

  describe('floorToTenMinutes', () => {
    it.each([
      ['2026-10-06T11:17:45.123Z', '2026-10-06T11:10:00.000Z'],
      ['2026-10-06T11:10:00.000Z', '2026-10-06T11:10:00.000Z'],
      ['2026-10-06T11:09:59.999Z', '2026-10-06T11:00:00.000Z'],
    ])('%s → %s', (input, expected) => {
      expect(floorToTenMinutes(new Date(input)).toISOString()).toBe(expected);
    });
  });

  describe('lastTenMinuteSlots', () => {
    it('gera os horários em ordem crescente, terminando no slot atual', () => {
      const slots = lastTenMinuteSlots(new Date('2026-10-06T11:17:00Z'), 3);
      expect(slots.map((slot) => slot.toISOString())).toEqual([
        '2026-10-06T10:50:00.000Z',
        '2026-10-06T11:00:00.000Z',
        '2026-10-06T11:10:00.000Z',
      ]);
    });

    it('24 horas = 144 slots', () => {
      expect(lastTenMinuteSlots(new Date(), 144)).toHaveLength(144);
    });
  });
});
