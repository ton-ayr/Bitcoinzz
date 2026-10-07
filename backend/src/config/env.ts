import { z } from 'zod';

// Variável opcional: vazia ("SMTP_HOST=") conta como não definida.
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI é obrigatória'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
    // Formato aceito pelo jsonwebtoken: número + unidade (s, m, h ou d). Ex.: "8h", "30m".
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN deve ser como "8h", "30m" ou "1d"')
      .default('8h'),
    // Lista separada por vírgula: "http://localhost:3000,https://app.vercel.app"
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:3000')
      .transform((value) => value.split(',').map((origin) => origin.trim())),

    // Cotação: API pública v4 do Mercado Bitcoin (limite deles: 1 requisição/s por endpoint).
    QUOTE_API_URL: z.url().default('https://api.mercadobitcoin.net/api/v4'),
    QUOTE_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).max(60).default(10),

    // E-mail. Sem SMTP_HOST, os e-mails são apenas exibidos no log (modo desenvolvimento).
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    // No Brevo, precisa ser um remetente verificado na conta.
    MAIL_FROM: z.string().default('Bitcoinzz <no-reply@bitcoinzz.dev>'),
  })
  .superRefine((env, ctx) => {
    if (env.SMTP_HOST && (!env.SMTP_USER || !env.SMTP_PASS)) {
      ctx.addIssue({
        code: 'custom',
        path: ['SMTP_USER'],
        message: 'SMTP_USER e SMTP_PASS são obrigatórios quando SMTP_HOST está definido',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Valida as variáveis de ambiente na subida da aplicação.
 * Se algo estiver faltando, falha imediatamente com uma mensagem clara (fail fast).
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${problems}`);
  }

  return result.data;
}
