import { describe, expect, it } from 'vitest';
import { periodChangePercent, toChartSeries } from './history';
import type { HistoryPoint } from './types';

const point = (timestamp: string, sell: number, source: HistoryPoint['source'] = 'TICKER') => ({
  timestamp,
  buy: sell - 1,
  sell,
  source,
});

describe('toChartSeries', () => {
  it('ordena por horário e separa as séries de venda e compra', () => {
    const series = toChartSeries([
      point('2026-10-07T12:10:00Z', 420_010),
      point('2026-10-07T12:00:00Z', 420_000),
    ]);

    expect(series.times.map((time) => time.toISOString())).toEqual([
      '2026-10-07T12:00:00.000Z',
      '2026-10-07T12:10:00.000Z',
    ]);
    expect(series.sell).toEqual([420_000, 420_010]);
    expect(series.buy).toEqual([419_999, 420_009]);
  });

  it('faixa do eixo Y com folga de 10% da variação (para o gráfico não ficar achatado)', () => {
    const series = toChartSeries([
      point('2026-10-07T12:00:00Z', 420_000),
      point('2026-10-07T12:10:00Z', 421_000),
    ]);
    // mínimo 419.999 (compra) e máximo 421.000 → amplitude 1.001 → folga 100,1
    expect(series.yMin).toBeCloseTo(419_898.9);
    expect(series.yMax).toBeCloseTo(421_100.1);
  });

  it('preço constante ainda ganha uma folga visível (0,1%)', () => {
    const flat = toChartSeries([
      { timestamp: '2026-10-07T12:00:00Z', buy: 400_000, sell: 400_000, source: 'TICKER' },
      { timestamp: '2026-10-07T12:10:00Z', buy: 400_000, sell: 400_000, source: 'TICKER' },
    ]);
    expect(flat.yMax - flat.yMin).toBeCloseTo(800);
  });

  it('marca quando há pontos aproximados (backfill)', () => {
    expect(toChartSeries([point('2026-10-07T12:00:00Z', 1)]).hasBackfill).toBe(false);
    expect(toChartSeries([point('2026-10-07T12:00:00Z', 1, 'BACKFILL')]).hasBackfill).toBe(true);
  });

  it('lista vazia não quebra', () => {
    expect(toChartSeries([])).toMatchObject({ times: [], sell: [], hasBackfill: false });
  });
});

describe('periodChangePercent', () => {
  it('variação do primeiro para o último ponto', () => {
    expect(periodChangePercent({ sell: [400_000, 410_000, 420_000] })).toBeCloseTo(5);
    expect(periodChangePercent({ sell: [400_000, 380_000] })).toBeCloseTo(-5);
  });

  it('sem pontos → null', () => {
    expect(periodChangePercent({ sell: [] })).toBeNull();
  });
});
