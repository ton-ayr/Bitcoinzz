import { pino, type Logger } from 'pino';
import type { Env } from './env.js';

export type { Logger };

export function createLogger(env: Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>): Logger {
  return pino({
    level: env.LOG_LEVEL,
    // Nunca deixar segredos irem para os logs.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        '*.password',
        '*.passwordHash',
      ],
      censor: '[REDACTED]',
    },
    // Em desenvolvimento, logs coloridos e legíveis; em produção, JSON (melhor para ferramentas).
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
  });
}
