import bcrypt from 'bcryptjs';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

/** Custo 10: cada hash leva dezenas de milissegundos, o que torna ataques de força bruta caros. */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost = 10) {}

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.cost);
  }

  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
