import type { TransactionRunner } from '../../shared/database/transaction.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';
import type { NotificationService } from '../notifications/notification.service.js';
import type { TransactionRepository } from '../transactions/transaction.repository.js';
import type { User, UserRepository } from '../users/user.repository.js';

export class AccountService {
  constructor(
    private readonly users: UserRepository,
    private readonly transactions: TransactionRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly notifications: NotificationService,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    // Token válido de um usuário que não existe mais: tratamos como sessão inválida.
    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }
    return user;
  }

  async getBalance(userId: string): Promise<number> {
    const user = await this.getProfile(userId);
    return user.balanceCents;
  }

  /** Credita o saldo e registra o DEPOSIT no extrato, na mesma transação (tudo ou nada). */
  async deposit(userId: string, amountCents: number): Promise<{ balanceCents: number }> {
    const user = await this.transactionRunner.run(async () => {
      const updated = await this.users.incrementBalance(userId, amountCents);
      if (!updated) {
        throw new UnauthorizedError('Usuário não encontrado');
      }
      await this.transactions.create({ userId, type: 'DEPOSIT', amountCents });
      return updated;
    });

    // Só depois do commit: o e-mail nunca avisa de um depósito que foi desfeito.
    this.notifications.depositConfirmed(user, amountCents, user.balanceCents);

    return { balanceCents: user.balanceCents };
  }
}
