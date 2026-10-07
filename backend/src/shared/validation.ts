import { z } from 'zod';
import { hasAtMostTwoDecimals } from './money.js';

/**
 * Teto técnico para qualquer valor em R$ (R$ 100 bilhões). Garante que as contas em
 * centavos e satoshis fiquem dentro do limite seguro de inteiros do JavaScript.
 * Cada operação pode ter um limite de negócio menor (ex.: depósito).
 */
export const MAX_AMOUNT_REAIS = 100_000_000_000;

/** Valor em R$ como a API recebe (ex.: 87.5). Usado por depósito, compra e venda. */
export const reaisAmountSchema = z
  .number({ error: 'Informe o valor em reais (número)' })
  .positive('O valor deve ser maior que zero')
  .max(MAX_AMOUNT_REAIS, 'Valor acima do permitido')
  .refine(hasAtMostTwoDecimals, 'Use no máximo 2 casas decimais');
