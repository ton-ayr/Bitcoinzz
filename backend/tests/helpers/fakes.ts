import { randomUUID } from 'node:crypto';
import type { PasswordHasher } from '../../src/modules/auth/password-hasher.js';
import { ConflictError } from '../../src/shared/errors/app-error.js';
import type {
  CreateUserData,
  User,
  UserRepository,
  UserWithPassword,
} from '../../src/modules/users/user.repository.js';

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
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user) return null;
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    return this.users.find((user) => user.email === email) ?? null;
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
