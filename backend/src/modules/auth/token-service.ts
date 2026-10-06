import jwt, { type SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

export interface TokenService {
  sign(userId: string): string;
  /** Devolve o id do usuário do token ou lança 401 se o token for inválido ou estiver expirado. */
  verify(token: string): string;
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(userId: string): string {
    return jwt.sign({}, this.secret, {
      subject: userId,
      algorithm: 'HS256',
      expiresIn: this.expiresIn as NonNullable<SignOptions['expiresIn']>,
    });
  }

  verify(token: string): string {
    try {
      // Fixar o algoritmo impede o ataque de trocar o "alg" do token.
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || !payload.sub) {
        throw new UnauthorizedError('Token inválido');
      }
      return payload.sub;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Sessão expirada, faça login novamente');
      }
      throw new UnauthorizedError('Token inválido');
    }
  }
}
