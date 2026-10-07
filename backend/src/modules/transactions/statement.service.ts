import { endOfDay, parseDateOnly, startOfDay, subtractDays } from '../../shared/dates.js';
import { BadRequestError } from '../../shared/errors/app-error.js';
import type { StatementQuery } from './statement.schemas.js';
import type { Transaction, TransactionRepository } from './transaction.repository.js';

export const DEFAULT_PERIOD_DAYS = 90;
export const MAX_PERIOD_DAYS = 366;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface Statement {
  /** Período aplicado (início do primeiro dia e fim do último, no horário de São Paulo). */
  from: Date;
  to: Date;
  transactions: Transaction[];
}

/**
 * Extrato: depósitos, compras, vendas e reinvestimentos, com datas e cotações.
 * Sem datas → últimos 90 dias. Só `from` → até hoje. Só `to` → os 90 dias anteriores a ele.
 */
export class StatementService {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getStatement(userId: string, query: StatementQuery): Promise<Statement> {
    const { from, to } = this.resolvePeriod(query);
    const transactions = await this.transactions.findByUserBetween(userId, from, to);
    return { from, to, transactions };
  }

  private resolvePeriod(query: StatementQuery): { from: Date; to: Date } {
    const lastDay = query.to ? parseDateOnly(query.to) : this.now();
    const firstDay = query.from
      ? parseDateOnly(query.from)
      : subtractDays(lastDay, DEFAULT_PERIOD_DAYS);

    const from = startOfDay(firstDay);
    const to = endOfDay(lastDay);

    if (from > to) {
      throw new BadRequestError('Período inválido', [
        { field: 'from', message: 'A data inicial deve ser anterior ou igual à data final' },
      ]);
    }
    // Arredonda para cima: um período de 366 dias completos ainda é aceito.
    if (Math.round((to.getTime() - from.getTime()) / ONE_DAY_MS) > MAX_PERIOD_DAYS) {
      throw new BadRequestError('Período inválido', [
        { field: 'from', message: `O período máximo é de ${MAX_PERIOD_DAYS} dias` },
      ]);
    }

    return { from, to };
  }
}
