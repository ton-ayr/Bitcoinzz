import { describe, expect, it } from 'vitest';
import { groupByDay, periodTotals, presetRange, rangeError, toCsv } from './statement';
import type { StatementTransaction } from './types';

const tx = (
  id: string,
  type: StatementTransaction['type'],
  amount: number,
  createdAt: string,
  btc: [number, number] | null = null,
): StatementTransaction => ({
  id,
  type,
  amount,
  btcAmount: btc?.[0] ?? null,
  btcPrice: btc?.[1] ?? null,
  createdAt,
});

describe('período', () => {
  it('atalho "últimos N dias" com a mesma conta da API (hoje − N até hoje)', () => {
    expect(presetRange(90, '2026-10-07')).toEqual({ from: '2026-07-09', to: '2026-10-07' });
    expect(presetRange(7, '2026-10-07')).toEqual({ from: '2026-09-30', to: '2026-10-07' });
  });

  it('mesmas regras e mensagens da API', () => {
    expect(rangeError({ from: '2026-10-07', to: '2026-10-07' })).toBeNull();
    expect(rangeError({ from: '2026-10-08', to: '2026-10-07' })).toBe(
      'A data inicial deve ser anterior ou igual à data final',
    );
    // 366 dias contando as duas pontas: ainda vale; 367 não
    expect(rangeError({ from: '2025-10-07', to: '2026-10-07' })).toBeNull();
    expect(rangeError({ from: '2025-10-06', to: '2026-10-07' })).toBe(
      'O período máximo é de 366 dias',
    );
  });
});

describe('groupByDay', () => {
  it('agrupa no dia de São Paulo, do mais recente para o mais antigo, com Hoje e Ontem', () => {
    const groups = groupByDay(
      [
        tx('old', 'DEPOSIT', 100, '2026-10-01T12:00:00Z'),
        tx('late', 'DEPOSIT', 50, '2026-10-07T02:30:00Z'), // 23:30 do dia 6 em São Paulo
        tx('today', 'PURCHASE', 1500, '2026-10-07T14:00:00Z', [0.00358609, 418282]),
      ],
      '2026-10-07',
    );

    expect(groups.map(({ label, items }) => [label, items.map((item) => item.id)])).toEqual([
      ['Hoje', ['today']],
      ['Ontem', ['late']],
      ['01/10/2026', ['old']],
    ]);
  });
});

describe('periodTotals', () => {
  it('soma em inteiros por tipo; reinvestimento só conta', () => {
    const totals = periodTotals([
      tx('1', 'DEPOSIT', 0.1, '2026-10-07T12:00:00Z'),
      tx('2', 'DEPOSIT', 0.2, '2026-10-07T12:00:00Z'), // 0.1 + 0.2 em centavos = 30, sem 0.30000000000000004
      tx('3', 'PURCHASE', 1500, '2026-10-07T12:00:00Z', [0.00358609, 418282]),
      tx('4', 'SALE', 600, '2026-10-07T12:00:00Z', [0.0012, 500000]),
      tx('5', 'REINVESTMENT', 320, '2026-10-07T12:00:00Z', [0.0008, 400000]),
    ]);

    expect(totals).toEqual({
      depositedCents: 30,
      purchasedCents: 150_000,
      purchasedSats: 358_609,
      soldCents: 60_000,
      soldSats: 120_000,
      counts: { DEPOSIT: 2, PURCHASE: 1, SALE: 1, REINVESTMENT: 1 },
    });
  });
});

describe('toCsv', () => {
  it('formato do Excel em português: ";" e vírgula decimal, horário de São Paulo', () => {
    const csv = toCsv([
      tx('1', 'PURCHASE', 1500, '2026-10-07T17:05:00Z', [0.00358609, 418282]),
      tx('2', 'DEPOSIT', 5000, '2026-10-07T17:02:00Z'),
    ]);

    expect(csv.split('\r\n')).toEqual([
      'Data;Hora;Tipo;Valor (R$);BTC;Cotação (R$)',
      '07/10/2026;14:05;Compra de BTC;1500,00;0,00358609;418282,00',
      '07/10/2026;14:02;Depósito;5000,00;;',
    ]);
  });
});
