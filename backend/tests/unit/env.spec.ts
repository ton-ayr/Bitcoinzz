import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const validEnv = {
  MONGODB_URI: 'mongodb://localhost:27017/test',
  JWT_SECRET: 'a'.repeat(32),
};

describe('loadEnv', () => {
  it('aplica os valores padrão', () => {
    const env = loadEnv(validEnv);
    expect(env.PORT).toBe(3333);
    expect(env.JWT_EXPIRES_IN).toBe('8h');
    expect(env.CORS_ORIGIN).toEqual(['http://localhost:3000']);
  });

  it('separa várias origens de CORS', () => {
    const env = loadEnv({ ...validEnv, CORS_ORIGIN: 'http://a.com, https://b.com' });
    expect(env.CORS_ORIGIN).toEqual(['http://a.com', 'https://b.com']);
  });

  it('falha com mensagem clara quando falta variável ou o segredo é curto', () => {
    expect(() => loadEnv({ JWT_SECRET: 'curto' })).toThrow(/MONGODB_URI[\s\S]*JWT_SECRET/);
  });
});
