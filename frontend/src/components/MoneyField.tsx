'use client';

import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { formatBRL } from '@/lib/format';
import { parseMoneyInput, toReais } from '@/lib/money';

type MoneyFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type' | 'slotProps'> & {
  /** Valor em centavos. */
  value: number;
  onChange: (cents: number) => void;
};

/**
 * Campo de R$ "estilo app de banco": os dígitos digitados são os centavos
 * (1 → R$ 0,01; 12 → R$ 0,12; 12345 → R$ 123,45). Não há vírgula para errar, e apagar
 * remove o último dígito. No celular, abre o teclado numérico.
 *
 * Com valor zero o campo fica vazio ("R$ 0,00" é só o placeholder). Se mostrasse "R$ 0,00",
 * um dígito digitado antes desses zeros (o foco automático pode deixar o cursor no início)
 * viraria R$ 40,00 em vez de R$ 0,04.
 */
export function MoneyField({ value, onChange, sx, ...props }: MoneyFieldProps) {
  return (
    <TextField
      {...props}
      value={value > 0 ? formatBRL(toReais(value)) : ''}
      placeholder={formatBRL(0)}
      onChange={(event) => {
        const cents = parseMoneyInput(event.target.value);
        if (cents !== null) onChange(cents);
      }}
      slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'off' } }}
      sx={[
        {
          '& input': { fontSize: '1.75rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
