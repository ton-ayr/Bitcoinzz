import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../../src/modules/account/account.service.js';
import { NotificationService } from '../../src/modules/notifications/notification.service.js';
import { UnauthorizedError } from '../../src/shared/errors/app-error.js';
import {
  FakeMailer,
  InMemoryTransactionRepository,
  InMemoryUserRepository,
  PassThroughTransactionRunner,
} from '../helpers/fakes.js';
import { silentLogger } from '../helpers/test-app.js';

describe('AccountService', () => {
  let users: InMemoryUserRepository;
  let transactions: InMemoryTransactionRepository;
  let mailer: FakeMailer;
  let service: AccountService;
  let userId: string;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    transactions = new InMemoryTransactionRepository();
    mailer = new FakeMailer();
    service = new AccountService(
      users,
      transactions,
      new PassThroughTransactionRunner(),
      new NotificationService(mailer, silentLogger),
    );
    ({ id: userId } = await users.create({
      name: 'Fulano',
      email: 'fulano@email.com',
      passwordHash: 'x',
    }));
  });

  it('depósito soma ao saldo e registra DEPOSIT no extrato', async () => {
    await service.deposit(userId, 8750);
    const result = await service.deposit(userId, 10000);

    expect(result.balanceCents).toBe(18750);
    expect(transactions.transactions).toEqual([
      expect.objectContaining({ userId, type: 'DEPOSIT', amountCents: 8750 }),
      expect.objectContaining({ userId, type: 'DEPOSIT', amountCents: 10000 }),
    ]);
  });

  it('depósito dispara o e-mail com o valor depositado', async () => {
    await service.deposit(userId, 8750);
    await vi.waitFor(() => expect(mailer.sent).toHaveLength(1));
    expect(mailer.sent[0]?.text).toContain('R$ 87,50');
  });

  it('usuário inexistente → 401 e nada é registrado', async () => {
    await expect(service.deposit('nao-existe', 100)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(transactions.transactions).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it('perfil e saldo', async () => {
    await service.deposit(userId, 500);
    expect(await service.getBalance(userId)).toBe(500);
    expect(await service.getProfile(userId)).toMatchObject({ name: 'Fulano' });
  });
});
