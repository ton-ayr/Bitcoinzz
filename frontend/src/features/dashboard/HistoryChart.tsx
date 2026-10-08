'use client';

import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  ChartsTooltipContainer,
  useAxesTooltip,
  type ChartsTooltipProps,
} from '@mui/x-charts/ChartsTooltip';
import { LineChart, lineClasses } from '@mui/x-charts/LineChart';
import { createContext, useContext } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { formatBRL, formatDateTime, formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { periodChangePercent, toChartSeries } from './history';
import { VariationChip } from './KpiCards';
import { useHistory } from './queries';
import type { HistoryPoint } from './types';

// O tooltip é renderizado pelo gráfico; o contexto entrega a ele os pontos originais.
const PointsContext = createContext<HistoryPoint[]>([]);

// Por padrão o MUI X coloca o tooltip (position: fixed) dentro do próprio gráfico. Como o Card de
// vidro tem backdrop-filter, o "fixed" passaria a ser relativo ao Card e o tooltip sairia do lugar.
// Renderizando no <body>, ele volta a ser relativo à janela. (Função: só roda no navegador.)
const tooltipContainer = () => document.body;

/** Tooltip próprio: horário + venda + compra (+ aviso nos pontos aproximados). */
function HistoryTooltip(props: ChartsTooltipProps) {
  const points = useContext(PointsContext);
  const axes = useAxesTooltip();
  const point = axes?.[0] ? points[axes[0].dataIndex] : undefined;

  return (
    <ChartsTooltipContainer {...props} trigger="axis" container={tooltipContainer}>
      {point && (
        <Stack
          spacing={0.5}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(22, 23, 29, 0.92)',
            border: `1px solid ${colors.border}`,
            backdropFilter: 'blur(12px)',
            minWidth: 180,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(point.timestamp)}
          </Typography>
          <Typography variant="body2">
            Venda <strong>{formatBRL(point.sell)}</strong>
          </Typography>
          <Typography variant="body2">
            Compra <strong>{formatBRL(point.buy)}</strong>
          </Typography>
          {point.source === 'BACKFILL' && (
            <Typography variant="caption" sx={{ color: colors.warning }}>
              Aproximado (preço negociado)
            </Typography>
          )}
        </Stack>
      )}
    </ChartsTooltipContainer>
  );
}

export function HistoryChart() {
  const history = useHistory();
  const points = history.data ?? [];
  const series = toChartSeries(points);
  const change = periodChangePercent(series);

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, '&:hover': { transform: 'none' } }}>
      {/* No celular, o chip de variação desce para baixo do título em vez de espremê-lo. */}
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', mb: 1 }}
      >
        <div>
          <Typography variant="h6" component="h2">
            Cotação nas últimas 24 h
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Preço de venda a cada 10 minutos · toque ou passe o mouse para ver compra e venda
          </Typography>
        </div>
        {change !== null && <VariationChip value={change} size="medium" />}
      </Stack>

      {history.isPending ? (
        <Skeleton variant="rounded" height={280} sx={{ mt: 2 }} />
      ) : history.isError ? (
        <EmptyState
          icon={<ShowChartRoundedIcon />}
          title="Não foi possível carregar o histórico"
          description="Tente de novo em instantes."
          action={
            <Button variant="outlined" onClick={() => history.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      ) : points.length < 2 ? (
        <EmptyState
          icon={<ShowChartRoundedIcon />}
          title="O histórico está começando"
          description="As cotações são registradas a cada 10 minutos. Volte daqui a pouco para ver o gráfico."
        />
      ) : (
        <PointsContext.Provider value={points}>
          <LineChart
            height={290}
            margin={{ left: 8, right: 8, top: 16, bottom: 8 }}
            xAxis={[
              {
                data: series.times,
                scaleType: 'time',
                valueFormatter: (value: Date) => formatTime(value),
                tickNumber: 6,
              },
            ]}
            yAxis={[
              {
                min: series.yMin,
                max: series.yMax,
                width: 72,
                valueFormatter: (value: number) => `R$ ${Math.round(value / 1000)} mil`,
                tickNumber: 4,
              },
            ]}
            series={[
              {
                id: 'sell',
                data: series.sell,
                label: 'Venda',
                area: true,
                // A área vai até o piso do eixo (e não até R$ 0): o gradiente aparece inteiro.
                baseline: 'min',
                showMark: false,
                curve: 'monotoneX',
                color: colors.blurpleLight,
              },
            ]}
            grid={{ horizontal: true }}
            hideLegend
            slots={{ tooltip: HistoryTooltip }}
            sx={{
              [`& .${lineClasses.area}`]: { fill: 'url(#history-area)' },
              [`& .${lineClasses.line}`]: { strokeWidth: 2.5 },
              '& .MuiChartsGrid-line': { stroke: 'rgba(255,255,255,0.06)' },
              '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: 'rgba(255,255,255,0.12)' },
              '& .MuiChartsAxis-tickLabel': { fill: colors.textSecondary },
            }}
          >
            <defs>
              <linearGradient id="history-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.blurple} stopOpacity={0.45} />
                <stop offset="100%" stopColor={colors.blurple} stopOpacity={0} />
              </linearGradient>
            </defs>
          </LineChart>
          {series.hasBackfill && (
            <Typography variant="caption" color="text.secondary">
              Parte dos pontos foi preenchida com o preço negociado enquanto o servidor estava
              inativo (plano gratuito); nesses pontos, compra e venda são aproximadas.
            </Typography>
          )}
        </PointsContext.Provider>
      )}
    </Card>
  );
}
