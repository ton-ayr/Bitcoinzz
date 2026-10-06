import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { JwtTokenService } from '../../src/modules/auth/token-service.js';
import { ConflictError, UnauthorizedError } from '../../src/shared/errors/app-error.js';
import { FakePasswordHasher, InMemoryUserRepository } from '../helpers/fakes.js';
import { TEST_JWT_SECRET } from '../helpers/test-app.js';

describe('AuthService', () => {
  let users: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let tokens: JwtTokenService;
  let service: AuthService;

  const fulano = { name: 'Fulano da Silva', email: 'fulano@email.com', password: 'fulano123' };

  beforeEach(() => {
    users = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    tokens = new JwtTokenService(TEST_JWT_SECRET, '8h');
    service = new AuthService(users, hasher, tokens);
  });

  describe('register', () => {
    it('guarda apenas o hash da senha, nunca a senha', async () => {
      const user = await service.register(fulano);

      expect(user).toMatchObject({ name: fulano.name, email: fulano.email, balanceCents: 0 });
      expect(user).not.toHaveProperty('passwordHash');
      expect(users.users[0]?.passwordHash).toBe('hashed:fulano123');
    });

    it('e-mail já cadastrado → 409', async () => {
      await service.register(fulano);
      await expect(service.register(fulano)).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register(fulano);
    });

    it('devolve um JWT com o id do usuário', async () => {
      const { token } = await service.login({ email: fulano.email, password: fulano.password });
      expect(tokens.verify(token)).toBe(users.users[0]?.id);
    });

    it('senha errada → 401 com mensagem genérica', async () => {
      await expect(service.login({ email: fulano.email, password: 'errada123' })).rejects.toThrow(
        new UnauthorizedError('E-mail ou senha inválidos'),
      );
    });

    it('e-mail inexistente → mesma mensagem e ainda compara uma senha (mesmo tempo de resposta)', async () => {
      hasher.compareCalls = 0;
      await expect(
        service.login({ email: 'ninguem@email.com', password: 'qualquer1' }),
      ).rejects.toThrow(new UnauthorizedError('E-mail ou senha inválidos'));
      expect(hasher.compareCalls).toBe(1);
    });
  });
});
