'use client';

import 'dayjs/locale/pt-br';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from '@mui/x-date-pickers/locales';
import dayjs, { type Dayjs } from 'dayjs';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { PERIOD_PRESETS, type DateRange, type PeriodPreset } from './statement';

const pickerTexts = ptBR.components.MuiLocalizationProvider.defaultProps.localeText;
const DAY_FORMAT = 'YYYY-MM-DD';

interface StatementFiltersProps {
  range: DateRange;
  /** Atalho ativo; null quando as datas foram escolhidas à mão. */
  preset: PeriodPreset | null;
  today: string;
  error: string | null;
  onPreset: (preset: PeriodPreset) => void;
  onRangeChange: (range: DateRange) => void;
}

/**
 * Período do extrato: atalhos (7, 30 e 90 dias) ou datas "de/até" no calendário.
 * O LocalizationProvider fica só aqui: o código dos Date Pickers é carregado apenas nesta tela.
 */
export function StatementFilters({
  range,
  preset,
  today,
  error,
  onPreset,
  onRangeChange,
}: StatementFiltersProps) {
  // Datas digitadas pela metade ficam inválidas: só aplica quando a data está completa.
  const pick = (field: keyof DateRange) => (value: Dayjs | null) => {
    if (value?.isValid()) onRangeChange({ ...range, [field]: value.format(DAY_FORMAT) });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br" localeText={pickerTexts}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <FocusGroup
          role="group"
          aria-label="Período"
          sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
        >
          {PERIOD_PRESETS.map((days) => (
            <Chip
              key={days}
              className={FOCUS_ITEM}
              label={`${days} dias`}
              color={preset === days ? 'primary' : 'default'}
              variant={preset === days ? 'filled' : 'outlined'}
              aria-pressed={preset === days}
              onClick={() => onPreset(days)}
            />
          ))}
        </FocusGroup>
        <Stack direction="row" spacing={1.5}>
          <DatePicker
            label="De"
            value={dayjs(range.from)}
            maxDate={dayjs(range.to)}
            onChange={pick('from')}
            slotProps={{ textField: { size: 'small', sx: { width: { xs: '100%', md: 170 } } } }}
          />
          <DatePicker
            label="Até"
            value={dayjs(range.to)}
            minDate={dayjs(range.from)}
            maxDate={dayjs(today)}
            onChange={pick('to')}
            slotProps={{ textField: { size: 'small', sx: { width: { xs: '100%', md: 170 } } } }}
          />
        </Stack>
      </Stack>
      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </LocalizationProvider>
  );
}
