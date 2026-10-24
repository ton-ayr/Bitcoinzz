import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { JwtTokenService } from '../../src/modules/auth/token-service.js';
import { NotificationService } from '../../src/modules/notifications/notification.service.js';
import { ConflictError, UnauthorizedError } from '../../src/shared/errors/app-error.js';
import { FakeMailer, FakePasswordHasher, InMemoryUserRepository } from '../helpers/fakes.js';
import { silentLogger, TEST_JWT_SECRET } from '../helpers/test-app.js';

describe('AuthService', () => {
  let users: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let tokens: JwtTokenService;
  let mailer: FakeMailer;
  let service: AuthService;

  const fulano = { name: 'Fulano da Silva', email: 'fulano@email.com', password: 'fulano123' };

  beforeEach(() => {
    users = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    tokens = new JwtTokenService(TEST_JWT_SECRET, '8h');
    mailer = new FakeMailer();
    service = new AuthService(users, hasher, tokens, new NotificationService(mailer, silentLogger));
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

    it('envia o e-mail de boas-vindas para a conta criada', async () => {
      await service.register(fulano);
      await vi.waitFor(() => expect(mailer.sent).toHaveLength(1));
      expect(mailer.sent[0]).toMatchObject({
        to: fulano.email,
        subject: 'Sua conta no Bitcoinzz foi criada',
      });
    });

    it('cadastro recusado (409) não envia e-mail', async () => {
      await service.register(fulano);
      await expect(service.register(fulano)).rejects.toBeInstanceOf(ConflictError);
      expect(mailer.sent).toHaveLength(1); // só o do primeiro cadastro
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
