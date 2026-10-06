import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { JwtTokenService } from '../../src/modules/auth/token-service.js';
import { TEST_JWT_SECRET } from '../helpers/test-app.js';

describe('JwtTokenService', () => {
  const service = new JwtTokenService(TEST_JWT_SECRET, '8h');

  it('assina e verifica o id do usuário', () => {
    expect(service.verify(service.sign('user-123'))).toBe('user-123');
  });

  it('o token expira em 8 horas', () => {
    const payload = jwt.decode(service.sign('user-123')) as { iat: number; exp: number };
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
  });

  it('rejeita token assinado com outro segredo', () => {
    const forged = jwt.sign({}, 'outro-segredo-qualquer-com-32-caracteres!', { subject: 'x' });
    expect(() => service.verify(forged)).toThrow('Token inválido');
  });

  it('rejeita token expirado com mensagem própria', () => {
    const expired = jwt.sign({ exp: Math.floor(Date.now() / 1000) - 10 }, TEST_JWT_SECRET, {
      subject: 'user-123',
    });
    expect(() => service.verify(expired)).toThrow('Sessão expirada, faça login novamente');
  });

  it('rejeita token sem usuário (sub) e texto qualquer', () => {
    expect(() => service.verify(jwt.sign({}, TEST_JWT_SECRET))).toThrow('Token inválido');
    expect(() => service.verify('nao-e-um-jwt')).toThrow('Token inválido');
  });
});
