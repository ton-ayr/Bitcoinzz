import type { HistoryPoint } from './types';

export interface ChartSeries {
  times: Date[];
  sell: number[];
  buy: number[];
  /** Há pontos preenchidos com o preço negociado (aproximados)? */
  hasBackfill: boolean;
  /** Faixa do eixo Y com uma folga, para a variação não ficar "achatada" no gráfico. */
  yMin: number;
  yMax: number;
}

/** Converte o histórico da API nas séries do gráfico (em ordem de tempo). */
export function toChartSeries(points: HistoryPoint[]): ChartSeries {
  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const sell = sorted.map((point) => point.sell);
  const buy = sorted.map((point) => point.buy);
  const all = [...sell, ...buy];
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 0;
  // 10% da amplitude de folga (ou 0,1% do preço, se a amplitude for zero).
  const padding = (max - min) * 0.1 || max * 0.001;

  return {
    times: sorted.map((point) => new Date(point.timestamp)),
    sell,
    buy,
    hasBackfill: sorted.some((point) => point.source === 'BACKFILL'),
    yMin: Math.max(0, min - padding),
    yMax: max + padding,
  };
}

/** Variação do primeiro para o último ponto do período, em %. */
export function periodChangePercent(series: Pick<ChartSeries, 'sell'>): number | null {
  const first = series.sell[0];
  const last = series.sell.at(-1);
  if (first === undefined || last === undefined || first === 0) return null;
  return ((last - first) / first) * 100;
}
