import { z } from 'zod';
import { parseDateOnly } from '../../shared/dates.js';

function isValidDateOnly(value: string): boolean {
  try {
    parseDateOnly(value);
    return true;
  } catch {
    return false;
  }
}

const dateOnlySchema = z
  .string()
  .refine(isValidDateOnly, 'Data inválida: use o formato AAAA-MM-DD (ex.: 2026-10-06)');

/** `GET /extract?from=2026-07-01&to=2026-10-06`. Os dois são opcionais (padrão: últimos 90 dias). */
export const statementQuerySchema = z.object({
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});

export type StatementQuery = z.infer<typeof statementQuerySchema>;
