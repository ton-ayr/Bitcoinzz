import type { RequestHandler } from 'express';
import { isDatabaseConnected } from './config/database.js';
import type { Logger } from './config/logger.js';
import { AccountController } from './modules/account/account.controller.js';
import { AccountService } from './modules/account/account.service.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BcryptPasswordHasher, type PasswordHasher } from './modules/auth/password-hasher.js';
import { JwtTokenService, type TokenService } from './modules/auth/token-service.js';
import { HealthController } from './modules/health/health.controller.js';
import { HistoryController } from './modules/history/history.controller.js';
import { HistoryJob } from './modules/history/history.job.js';
import { HistoryService } from './modules/history/history.service.js';
import {
  MongoosePriceSnapshotRepository,
  type PriceSnapshotRepository,
} from './modules/history/price-snapshot.repository.js';
import { InvestmentController } from './modules/investments/investment.controller.js';
import {
  MongooseInvestmentRepository,
  type InvestmentRepository,
} from './modules/investments/investment.repository.js';
import { PositionService } from './modules/investments/position.service.js';
import { PurchaseService } from './modules/investments/purchase.service.js';
import { SaleService } from './modules/investments/sale.service.js';
import { createMailer, type MailSettings } from './modules/notifications/create-mailer.js';
import type { Mailer } from './modules/notifications/mailer.js';
import { NotificationService } from './modules/notifications/notification.service.js';
import { MercadoBitcoinClient } from './modules/quotes/mercado-bitcoin.client.js';
import { QuoteController } from './modules/quotes/quote.controller.js';
import type { CandleProvider, QuoteProvider } from './modules/quotes/quote.provider.js';
import { QuoteService } from './modules/quotes/quote.service.js';
import { StatementService } from './modules/transactions/statement.service.js';
import { TransactionController } from './modules/transactions/transaction.controller.js';
import {
  MongooseTransactionRepository,
  type TransactionRepository,
} from './modules/transactions/transaction.repository.js';
import { VolumeService } from './modules/transactions/volume.service.js';
import { MongooseUserRepository, type UserRepository } from './modules/users/user.repository.js';
import {
  MongooseTransactionRunner,
  type TransactionRunner,
} from './shared/database/transaction.js';
import { createAuthenticate } from './shared/http/authenticate.js';
import { createUserRateLimiter } from './shared/http/rate-limit.js';

/**
 * Composition root: o ÚNICO lugar que sabe como montar as peças da aplicação.
 * Cria repositories → services → controllers e entrega cada dependência pelo construtor
 * (injeção de dependência manual). Nos testes, as dependências podem ser trocadas por fakes.
 */
export interface Container {
  /** Middlewares das rotas logadas: autenticação + limite por usuário. */
  requireAuth: RequestHandler[];
  healthController: HealthController;
  authController: AuthController;
  accountController: AccountController;
  quoteController: QuoteController;
  investmentController: InvestmentController;
  transactionController: TransactionController;
  historyController: HistoryController;
  /** Coleta da cotação a cada 10 min. Iniciado pelo server.ts (não nos testes de rota). */
  historyJob: HistoryJob;
}

export interface ContainerSettings {
  jwtSecret: string;
  jwtExpiresIn: string;
  mail: MailSettings;
  quote: { apiUrl: string; cacheTtlSeconds: number };
  logger: Logger;
}

export interface ContainerDependencies {
  isDatabaseConnected: () => boolean;
  userRepository: UserRepository;
  transactionRepository: TransactionRepository;
  investmentRepository: InvestmentRepository;
  transactionRunner: TransactionRunner;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
  mailer: Mailer;
  quoteProvider: QuoteProvider;
  candleProvider: CandleProvider;
  priceSnapshotRepository: PriceSnapshotRepository;
}

export function createContainer(
  settings: ContainerSettings,
  overrides: Partial<ContainerDependencies> = {},
): Container {
  const { logger } = settings;
  // Um único client do Mercado Bitcoin atende a cotação e os candles.
  const marketClient = new MercadoBitcoinClient({ baseUrl: settings.quote.apiUrl });

  const dependencies: ContainerDependencies = {
    isDatabaseConnected,
    userRepository: new MongooseUserRepository(),
    transactionRepository: new MongooseTransactionRepository(),
    investmentRepository: new MongooseInvestmentRepository(),
    transactionRunner: new MongooseTransactionRunner(),
    passwordHasher: new BcryptPasswordHasher(),
    tokenService: new JwtTokenService(settings.jwtSecret, settings.jwtExpiresIn),
    quoteProvider: marketClient,
    candleProvider: marketClient,
    priceSnapshotRepository: new MongoosePriceSnapshotRepository(),
    ...overrides,
    // Criado só se não veio um fake (evita o aviso de "SMTP não configurado" nos testes).
    mailer: overrides.mailer ?? createMailer(settings.mail, logger),
  };

  const notifications = new NotificationService(dependencies.mailer, logger);
  const quoteService = new QuoteService(
    dependencies.quoteProvider,
    settings.quote.cacheTtlSeconds * 1000,
  );
  const historyService = new HistoryService(
    dependencies.priceSnapshotRepository,
    quoteService,
    dependencies.candleProvider,
  );

  const authService = new AuthService(
    dependencies.userRepository,
    dependencies.passwordHasher,
    dependencies.tokenService,
  );
  const accountService = new AccountService(
    dependencies.userRepository,
    dependencies.transactionRepository,
    dependencies.transactionRunner,
    notifications,
  );

  return {
    requireAuth: [createAuthenticate(dependencies.tokenService), createUserRateLimiter()],
    healthController: new HealthController(dependencies.isDatabaseConnected),
    authController: new AuthController(authService),
    accountController: new AccountController(accountService),
    quoteController: new QuoteController(quoteService),
    investmentController: new InvestmentController(
      new PurchaseService(
        dependencies.userRepository,
        dependencies.investmentRepository,
        dependencies.transactionRepository,
        dependencies.transactionRunner,
        quoteService,
        notifications,
      ),
      new PositionService(dependencies.investmentRepository, quoteService),
      new SaleService(
        dependencies.userRepository,
        dependencies.investmentRepository,
        dependencies.transactionRepository,
        dependencies.transactionRunner,
        quoteService,
        notifications,
      ),
    ),
    transactionController: new TransactionController(
      new StatementService(dependencies.transactionRepository),
      new VolumeService(dependencies.transactionRepository),
    ),
    historyController: new HistoryController(historyService),
    historyJob: new HistoryJob(historyService, logger),
  };
}
