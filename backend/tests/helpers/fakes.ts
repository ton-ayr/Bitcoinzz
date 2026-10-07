import { randomUUID } from 'node:crypto';
import type { PasswordHasher } from '../../src/modules/auth/password-hasher.js';
import type {
  CreateInvestmentData,
  Investment,
  InvestmentRepository,
} from '../../src/modules/investments/investment.repository.js';
import type { Mailer, MailMessage } from '../../src/modules/notifications/mailer.js';
import type {
  PriceSnapshot,
  PriceSnapshotRepository,
} from '../../src/modules/history/price-snapshot.repository.js';
import type {
  CandleProvider,
  MinuteCandle,
  Quote,
  QuoteProvider,
} from '../../src/modules/quotes/quote.provider.js';
import type {
  BtcVolume,
  CreateTransactionData,
  Transaction,
  TransactionRepository,
} from '../../src/modules/transactions/transaction.repository.js';
import type {
  CreateUserData,
  User,
  UserRepository,
  UserWithPassword,
} from '../../src/modules/users/user.repository.js';
import type { TransactionRunner } from '../../src/shared/database/transaction.js';
import { ConflictError } from '../../src/shared/errors/app-error.js';

function withoutPassword({ passwordHash, ...user }: UserWithPassword): User {
  return user;
}

/** Repository em memória: mesmo contrato do Mongoose, sem banco. Ideal para testes unitários. */
export class InMemoryUserRepository implements UserRepository {
  readonly users: UserWithPassword[] = [];

  async create(data: CreateUserData): Promise<User> {
    if (this.users.some((user) => user.email === data.email)) {
      throw new ConflictError('Este e-mail já está cadastrado');
    }
    const user: UserWithPassword = {
      id: randomUUID(),
      balanceCents: 0,
      createdAt: new Date(),
      ...data,
    };
    this.users.push(user);
    return withoutPassword(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((candidate) => candidate.id === id);
    return user ? withoutPassword(user) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async debitBalance(id: string, amountCents: number): Promise<User | null> {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user || user.balanceCents < amountCents) return null;
    user.balanceCents -= amountCents;
    return withoutPassword(user);
  }

  async incrementBalance(id: string, deltaCents: number): Promise<User | null> {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user) return null;
    user.balanceCents += deltaCents;
    return withoutPassword(user);
  }
}

export class InMemoryTransactionRepository implements TransactionRepository {
  readonly transactions: Transaction[] = [];
  /** Últimos argumentos recebidos, para os testes conferirem o período calculado. */
  lastQuery?: { userId?: string; from: Date; to: Date };

  async create(data: CreateTransactionData): Promise<Transaction> {
    const transaction: Transaction = { id: randomUUID(), createdAt: new Date(), ...data };
    this.transactions.push(transaction);
    return transaction;
  }

  async findByUserBetween(userId: string, from: Date, to: Date): Promise<Transaction[]> {
    this.lastQuery = { userId, from, to };
    return this.transactions
      .filter((t) => t.userId === userId && t.createdAt >= from && t.createdAt <= to)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async sumBtcVolumeBetween(from: Date, to: Date): Promise<BtcVolume> {
    this.lastQuery = { from, to };
    const sum = (type: 'PURCHASE' | 'SALE') =>
      this.transactions
        .filter((t) => t.type === type && t.createdAt >= from && t.createdAt <= to)
        .reduce((total, t) => total + (t.btcSats ?? 0), 0);
    return { boughtSats: sum('PURCHASE'), soldSats: sum('SALE') };
  }
}

/** Nos testes unitários não há banco: o "bloco transacional" só é executado. */
export class PassThroughTransactionRunner implements TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

/** Guarda os e-mails "enviados" para os testes conferirem. */
export class FakeMailer implements Mailer {
  readonly sent: MailMessage[] = [];

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message);
  }
}

/** "Hash" previsível e instantâneo, só para testes. */
export class FakePasswordHasher implements PasswordHasher {
  compareCalls = 0;

  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    this.compareCalls += 1;
    return hash === `hashed:${password}`;
  }
}

/** Cotação controlada pelo teste. Por padrão: compra R$ 427.253,00 e venda R$ 427.254,00. */
export class FakeQuoteProvider implements QuoteProvider {
  calls = 0;
  failure?: Error;

  constructor(
    public buyCents = 42725300,
    public sellCents = 42725400,
  ) {}

  async fetchQuote(): Promise<Quote> {
    this.calls += 1;
    if (this.failure) throw this.failure;
    return { buyCents: this.buyCents, sellCents: this.sellCents, fetchedAt: new Date() };
  }
}

export class InMemoryInvestmentRepository implements InvestmentRepository {
  readonly investments: Investment[] = [];

  async create(data: CreateInvestmentData): Promise<Investment> {
    const investment: Investment = { id: randomUUID(), status: 'OPEN', ...data };
    this.investments.push(investment);
    return investment;
  }

  async close(ids: string[], closedAt: Date): Promise<void> {
    for (const investment of this.investments) {
      if (ids.includes(investment.id)) {
        investment.status = 'CLOSED';
        investment.closedAt = closedAt;
      }
    }
  }

  async findOpenByUser(userId: string): Promise<Investment[]> {
    return this.investments
      .filter((investment) => investment.userId === userId && investment.status === 'OPEN')
      .sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime());
  }
}

/** Candles controlados pelo teste. */
export class FakeCandleProvider implements CandleProvider {
  calls: { from: Date; to: Date }[] = [];
  failure?: Error;

  constructor(public candles: MinuteCandle[] = []) {}

  async fetchMinuteCandles(from: Date, to: Date): Promise<MinuteCandle[]> {
    this.calls.push({ from, to });
    if (this.failure) throw this.failure;
    return this.candles.filter((candle) => candle.time >= from && candle.time <= to);
  }
}

export class InMemoryPriceSnapshotRepository implements PriceSnapshotRepository {
  readonly snapshots: PriceSnapshot[] = [];

  async saveIfMissing(snapshot: PriceSnapshot): Promise<boolean> {
    if (this.snapshots.some((s) => s.bucket.getTime() === snapshot.bucket.getTime())) return false;
    this.snapshots.push(snapshot);
    return true;
  }

  async findBucketsBetween(from: Date, to: Date): Promise<Date[]> {
    return (await this.findBetween(from, to)).map((snapshot) => snapshot.bucket);
  }

  async findBetween(from: Date, to: Date): Promise<PriceSnapshot[]> {
    return this.snapshots
      .filter((snapshot) => snapshot.bucket >= from && snapshot.bucket <= to)
      .sort((a, b) => a.bucket.getTime() - b.bucket.getTime());
  }
}
