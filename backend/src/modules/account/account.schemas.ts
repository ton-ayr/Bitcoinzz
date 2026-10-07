import { z } from 'zod';
import { reaisToCents } from '../../shared/money.js';
import { reaisAmountSchema } from '../../shared/validation.js';

export const MAX_DEPOSIT_REAIS = 1_000_000;

// Entrada `{ amount: 87.5 }` → saída `{ amountCents: 8750 }`: o resto do código só vê inteiros.
export const depositSchema = z
  .object({
    amount: reaisAmountSchema.max(
      MAX_DEPOSIT_REAIS,
      'O valor máximo por depósito é R$ 1.000.000,00',
    ),
  })
  .transform(({ amount }) => ({ amountCents: reaisToCents(amount) }));

export type DepositInput = z.infer<typeof depositSchema>;
