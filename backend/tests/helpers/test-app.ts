import { pino } from 'pino';
import { createApp } from '../../src/app.js';
import { createContainer, type ContainerDependencies } from '../../src/container.js';

export const silentLogger = pino({ level: 'silent' });

export const TEST_JWT_SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres';

/** App completo para testes de rota, com dependências substituíveis. */
export function createTestApp(overrides: Partial<ContainerDependencies> = {}) {
  return createApp({
    container: createContainer(
      { jwtSecret: TEST_JWT_SECRET, jwtExpiresIn: '8h' },
      { isDatabaseConnected: () => true, ...overrides },
    ),
    logger: silentLogger,
    corsOrigins: ['http://localhost:3000'],
  });
}
