import { z } from 'zod';
import { reaisToCents } from '../../shared/money.js';
import { reaisAmountSchema } from '../../shared/validation.js';

// `{ amount: 25 }` (R$) → `{ amountCents: 2500 }`. Mesmo formato da coleção Postman do desafio,
// tanto na compra quanto na venda (a venda também é informada em reais).
const tradeSchema = z
  .object({ amount: reaisAmountSchema })
  .transform(({ amount }) => ({ amountCents: reaisToCents(amount) }));

export const purchaseSchema = tradeSchema;
export const sellSchema = tradeSchema;

export type TradeInput = z.infer<typeof tradeSchema>;
