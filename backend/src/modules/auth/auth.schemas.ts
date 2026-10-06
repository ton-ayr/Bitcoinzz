import { z } from 'zod';

// trim + minúsculas ANTES de validar o formato, para " Fulano@Email.com " virar "fulano@email.com".
const emailSchema = z
  .string({ error: 'Informe o e-mail' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Informe um e-mail válido').max(254, 'E-mail muito longo'));

export const registerSchema = z.object({
  name: z
    .string({ error: 'Informe o nome' })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  email: emailSchema,
  password: z
    .string({ error: 'Informe a senha' })
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    // O bcrypt só considera os primeiros 72 bytes da senha.
    .max(72, 'A senha deve ter no máximo 72 caracteres')
    .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra')
    .regex(/\d/, 'A senha deve conter pelo menos um número'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'Informe a senha' }).min(1, 'Informe a senha'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
