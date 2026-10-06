import { UnauthorizedError } from '../../shared/errors/app-error.js';
import type { User, UserRepository } from '../users/user.repository.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import type { PasswordHasher } from './password-hasher.js';
import type { TokenService } from './token-service.js';

// Mesma mensagem para e-mail inexistente e senha errada: assim ninguém descobre
// quais e-mails estão cadastrados (enumeração de usuários).
const INVALID_CREDENTIALS = 'E-mail ou senha inválidos';

export class AuthService {
  // Hash de uma senha qualquer, usado para comparar quando o e-mail não existe.
  // Assim a resposta demora o mesmo tempo nos dois casos (evita ataque por tempo de resposta).
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async register(input: RegisterInput): Promise<User> {
    const passwordHash = await this.hasher.hash(input.password);
    return this.users.create({ name: input.name, email: input.email, passwordHash });
  }

  async login(input: LoginInput): Promise<{ token: string }> {
    const user = await this.users.findByEmailWithPassword(input.email);

    if (!user) {
      this.dummyHash ??= this.hasher.hash('senha-ficticia-123');
      await this.hasher.compare(input.password, await this.dummyHash);
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const passwordMatches = await this.hasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    return { token: this.tokens.sign(user.id) };
  }
}
