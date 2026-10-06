import type { RequestHandler } from 'express';
import { isDatabaseConnected } from './config/database.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BcryptPasswordHasher, type PasswordHasher } from './modules/auth/password-hasher.js';
import { JwtTokenService, type TokenService } from './modules/auth/token-service.js';
import { HealthController } from './modules/health/health.controller.js';
import { MongooseUserRepository, type UserRepository } from './modules/users/user.repository.js';
import { createAuthenticate } from './shared/http/authenticate.js';

/**
 * Composition root: o ÚNICO lugar que sabe como montar as peças da aplicação.
 * Cria repositories → services → controllers e entrega cada dependência pelo construtor
 * (injeção de dependência manual). Nos testes, as dependências podem ser trocadas por fakes.
 */
export interface Container {
  authenticate: RequestHandler;
  healthController: HealthController;
  authController: AuthController;
}

export interface ContainerSettings {
  jwtSecret: string;
  jwtExpiresIn: string;
}

export interface ContainerDependencies {
  isDatabaseConnected: () => boolean;
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
}

export function createContainer(
  settings: ContainerSettings,
  overrides: Partial<ContainerDependencies> = {},
): Container {
  const dependencies: ContainerDependencies = {
    isDatabaseConnected,
    userRepository: new MongooseUserRepository(),
    passwordHasher: new BcryptPasswordHasher(),
    tokenService: new JwtTokenService(settings.jwtSecret, settings.jwtExpiresIn),
    ...overrides,
  };

  const authService = new AuthService(
    dependencies.userRepository,
    dependencies.passwordHasher,
    dependencies.tokenService,
  );

  return {
    authenticate: createAuthenticate(dependencies.tokenService),
    healthController: new HealthController(dependencies.isDatabaseConnected),
    authController: new AuthController(authService),
  };
}
