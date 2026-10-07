import type { TransactionRunner } from '../../shared/database/transaction.js';
import { BusinessRuleError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { formatBRL } from '../../shared/format.js';
import { centsToSats, satsToCents } from '../../shared/money.js';
import type { NotificationService } from '../notifications/notification.service.js';
import type { QuoteService } from '../quotes/quote.service.js';
import type { TransactionRepository } from '../transactions/transaction.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import type { Investment, InvestmentRepository } from './investment.repository.js';

export interface Reinvestment {
  btcSats: number;
  /** Cotação ORIGINAL do investimento liquidado (centavos por 1 BTC). */
  btcPriceCents: number;
  investedCents: number;
}

export interface SaleResult {
  amountCents: number;
  btcSats: number;
  /** Cotação de compra usada na venda (centavos por 1 BTC). */
  btcPriceCents: number;
  reinvestment: Reinvestment | null;
  balanceCents: number;
}

/** Plano da venda, calculado antes de gravar qualquer coisa. */
interface SalePlan {
  closedIds: string[];
  soldSats: number;
  /** Investimento atingido parcialmente (se houver) e a sobra de BTC dele. */
  partial: { investment: Investment; leftoverSats: number } | null;
}

/**
 * Venda por valor em R$ (regras na seção 5 do PRD):
 * 1. Consome os investimentos do mais antigo para o mais novo (FIFO), pela cotação de COMPRA.
 * 2. O investimento atingido parcialmente é liquidado por inteiro; o BTC que sobra vira um
 *    REINVESTMENT com a MESMA cotação e a MESMA data do original (nenhum BTC é criado ou perdido).
 * 3. O extrato registra SALE (valor sacado) e, se houver, REINVESTMENT.
 */
export class SaleService {
  constructor(
    private readonly users: UserRepository,
    private readonly investments: InvestmentRepository,
    private readonly transactions: TransactionRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly quotes: QuoteService,
    private readonly notifications: NotificationService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async sell(userId: string, amountCents: number): Promise<SaleResult> {
    const { buyCents } = await this.quotes.getCurrent();

    const result = await this.transactionRunner.run(async () => {
      // Lido DENTRO da transação: se outra venda mexer na posição ao mesmo tempo,
      // o MongoDB detecta o conflito e repete este bloco com os dados novos.
      const open = await this.investments.findOpenByUser(userId);
      const plan = this.planSale(open, amountCents, buyCents);

      await this.investments.close(plan.closedIds, this.now());

      let reinvestment: Reinvestment | null = null;
      if (plan.partial) {
        const { investment, leftoverSats } = plan.partial;
        reinvestment = {
          btcSats: leftoverSats,
          btcPriceCents: investment.purchasePriceCents,
          investedCents: satsToCents(leftoverSats, investment.purchasePriceCents),
        };
        await this.investments.create({
          userId,
          btcSats: reinvestment.btcSats,
          investedCents: reinvestment.investedCents,
          purchasePriceCents: reinvestment.btcPriceCents,
          purchasedAt: investment.purchasedAt, // mantém o lugar na fila FIFO
          origin: 'REINVESTMENT',
          parentId: investment.id,
        });
      }

      const user = await this.users.incrementBalance(userId, amountCents);
      if (!user) throw new UnauthorizedError('Usuário não encontrado');

      await this.transactions.create({
        userId,
        type: 'SALE',
        amountCents,
        btcSats: plan.soldSats,
        btcPriceCents: buyCents,
      });
      if (reinvestment) {
        await this.transactions.create({
          userId,
          type: 'REINVESTMENT',
          amountCents: reinvestment.investedCents,
          btcSats: reinvestment.btcSats,
          btcPriceCents: reinvestment.btcPriceCents,
        });
      }

      return { user, soldSats: plan.soldSats, reinvestment };
    });

    this.notifications.saleConfirmed(result.user, amountCents, result.soldSats);

    return {
      amountCents,
      btcSats: result.soldSats,
      btcPriceCents: buyCents,
      reinvestment: result.reinvestment,
      balanceCents: result.user.balanceCents,
    };
  }

  /** Decide o que vender. Só calcula: não grava nada. */
  private planSale(open: Investment[], amountCents: number, buyCents: number): SalePlan {
    if (open.length === 0) {
      throw new BusinessRuleError('Você não tem bitcoins para vender.');
    }

    const positionValue = open.reduce(
      (total, investment) => total + satsToCents(investment.btcSats, buyCents),
      0,
    );
    if (amountCents > positionValue) {
      throw new BusinessRuleError(
        `Valor maior que a sua posição. Máximo disponível para venda: ${formatBRL(positionValue)}.`,
      );
    }

    const plan: SalePlan = { closedIds: [], soldSats: 0, partial: null };
    let remainingCents = amountCents;

    for (const investment of open) {
      if (remainingCents === 0) break;

      const valueCents = satsToCents(investment.btcSats, buyCents);
      plan.closedIds.push(investment.id);

      if (valueCents <= remainingCents) {
        // Cabe inteiro no valor pedido: vende todo o BTC deste investimento.
        plan.soldSats += investment.btcSats;
        remainingCents -= valueCents;
        continue;
      }

      // Parcial: vende só os sats necessários (arredondando PARA CIMA, para cobrir o valor).
      const sellSats = centsToSats(remainingCents, buyCents, 'ceil');
      const leftoverSats = investment.btcSats - sellSats;
      plan.soldSats += sellSats;
      remainingCents = 0;
      // Se o arredondamento consumiu todo o BTC, não sobra nada para reinvestir.
      if (leftoverSats > 0) {
        plan.partial = { investment, leftoverSats };
      }
    }

    return plan;
  }
}
