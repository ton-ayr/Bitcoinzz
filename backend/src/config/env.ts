import { z } from 'zod';

// Variável opcional: vazia ("MAILJET_API_KEY=") conta como não definida.
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

    // E-mail pela API HTTP da Mailjet. Sem as chaves, os e-mails são apenas exibidos no log.
    MAILJET_API_KEY: optionalString,
    MAILJET_SECRET_KEY: optionalString,
    // Precisa ser um remetente validado na conta da Mailjet.
    MAIL_FROM_EMAIL: optionalString.pipe(
      z.email('MAIL_FROM_EMAIL deve ser um e-mail válido').optional(),
    ),
    MAIL_FROM_NAME: z.string().trim().min(1).default('Bitcoinzz'),
  })
  .superRefine((env, ctx) => {
    const mailjet = [env.MAILJET_API_KEY, env.MAILJET_SECRET_KEY, env.MAIL_FROM_EMAIL];
    // Ou tudo configurado (envio real), ou nada (log): metade configurada é erro de digitação.
    if (mailjet.some(Boolean) && !mailjet.every(Boolean)) {
      ctx.addIssue({
        code: 'custom',
        path: ['MAILJET_API_KEY'],
        message:
          'MAILJET_API_KEY, MAILJET_SECRET_KEY e MAIL_FROM_EMAIL precisam ser preenchidas juntas',
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
