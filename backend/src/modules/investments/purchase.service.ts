import type { TransactionRunner } from '../../shared/database/transaction.js';
import { BusinessRuleError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { formatBRL } from '../../shared/format.js';
import { centsToSats } from '../../shared/money.js';
import type { NotificationService } from '../notifications/notification.service.js';
import type { QuoteService } from '../quotes/quote.service.js';
import type { TransactionRepository } from '../transactions/transaction.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import type { InvestmentRepository } from './investment.repository.js';

export interface PurchaseResult {
  amountCents: number;
  btcSats: number;
  /** Cotação de venda usada na conversão (centavos por 1 BTC). */
  btcPriceCents: number;
  balanceCents: number;
}

export class PurchaseService {
  constructor(
    private readonly users: UserRepository,
    private readonly investments: InvestmentRepository,
    private readonly transactions: TransactionRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly quotes: QuoteService,
    private readonly notifications: NotificationService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Converte R$ do saldo em BTC pela cotação de VENDA (o preço que o mercado cobra). */
  async purchase(userId: string, amountCents: number): Promise<PurchaseResult> {
    const { sellCents } = await this.quotes.getCurrent();

    // Arredonda para baixo: o cliente nunca recebe mais BTC do que pagou.
    const btcSats = centsToSats(amountCents, sellCents);
    if (btcSats === 0) {
      throw new BusinessRuleError(
        'Valor muito baixo: não compra nem 1 satoshi (0,00000001 BTC) na cotação atual.',
      );
    }

    // Débito do saldo + investimento + lançamento no extrato: tudo ou nada.
    const user = await this.transactionRunner.run(async () => {
      const debited = await this.users.debitBalance(userId, amountCents);
      if (!debited) {
        const current = await this.users.findById(userId);
        if (!current) throw new UnauthorizedError('Usuário não encontrado');
        throw new BusinessRuleError(
          `Saldo insuficiente. Disponível: ${formatBRL(current.balanceCents)}.`,
        );
      }

      await this.investments.create({
        userId,
        btcSats,
        investedCents: amountCents,
        purchasePriceCents: sellCents,
        purchasedAt: this.now(),
        origin: 'PURCHASE',
      });
      await this.transactions.create({
        userId,
        type: 'PURCHASE',
        amountCents,
        btcSats,
        btcPriceCents: sellCents,
      });

      return debited;
    });

    this.notifications.purchaseConfirmed(user, amountCents, btcSats, sellCents);

    return { amountCents, btcSats, btcPriceCents: sellCents, balanceCents: user.balanceCents };
  }
}
