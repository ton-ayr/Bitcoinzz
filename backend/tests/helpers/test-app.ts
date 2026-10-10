import { pino } from 'pino';
import { createApp } from '../../src/app.js';
import { createContainer, type ContainerDependencies } from '../../src/container.js';
import { BcryptPasswordHasher } from '../../src/modules/auth/password-hasher.js';
import { FakeCandleProvider, FakeMailer, FakeQuoteProvider } from './fakes.js';

export const silentLogger = pino({ level: 'silent' });

export const TEST_JWT_SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres';

/**
 * App completo para testes de rota, com dependências substituíveis.
 * Por padrão: bcrypt com custo 4 (rápido), e-mails capturados por um FakeMailer e
 * cotação fixa (FakeQuoteProvider).
 */
export function createTestApp(overrides: Partial<ContainerDependencies> = {}) {
  return createApp({
    container: createContainer(
      {
        jwtSecret: TEST_JWT_SECRET,
        jwtExpiresIn: '8h',
        logger: silentLogger,
        mail: {},
        quote: { apiUrl: 'http://cotacao.invalida', cacheTtlSeconds: 10 },
      },
      {
        isDatabaseConnected: () => true,
        passwordHasher: new BcryptPasswordHasher(4),
        mailer: new FakeMailer(),
        // Nunca chama o Mercado Bitcoin de verdade nos testes.
        quoteProvider: new FakeQuoteProvider(),
        candleProvider: new FakeCandleProvider(),
        ...overrides,
      },
    ),
    logger: silentLogger,
    corsOrigins: ['http://localhost:3000'],
  });
}
