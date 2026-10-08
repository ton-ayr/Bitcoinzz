'use client';

import Chip from '@mui/material/Chip';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { percentOf } from './preview';

const QUICK_PERCENTS = [
  { label: '25%', percent: 25 },
  { label: '50%', percent: 50 },
  { label: 'Tudo', percent: 100 },
];

/** Atalhos que preenchem uma parte do total (saldo na compra, posição na venda). */
export function QuickPercentChips({
  totalCents,
  onPick,
}: {
  /** null ou 0: atalhos desligados. */
  totalCents: number | null;
  onPick: (cents: number) => void;
}) {
  return (
    <FocusGroup sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {QUICK_PERCENTS.map(({ label, percent }) => (
        <Chip
          key={label}
          className={FOCUS_ITEM}
          label={label}
          variant="outlined"
          disabled={!totalCents}
          onClick={() => onPick(percentOf(totalCents ?? 0, percent))}
        />
      ))}
    </FocusGroup>
  );
}
