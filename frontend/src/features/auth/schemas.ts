import { z } from 'zod';

// Mesmas regras e mensagens da API (backend/src/modules/auth/auth.schemas.ts):
// o erro aparece na hora, sem precisar ir ao servidor, e a API continua validando por segurança.

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Informe o e-mail')
  .pipe(z.email('Informe um e-mail válido'));

/** Regras da senha, usadas na validação e no checklist ao vivo do cadastro. */
export const PASSWORD_RULES = [
  { id: 'length', label: 'Pelo menos 8 caracteres', test: (value: string) => value.length >= 8 },
  { id: 'letter', label: 'Uma letra', test: (value: string) => /[A-Za-z]/.test(value) },
  { id: 'number', label: 'Um número', test: (value: string) => /\d/.test(value) },
] as const;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome')
      .min(2, 'O nome deve ter pelo menos 2 caracteres')
      .max(100, 'O nome deve ter no máximo 100 caracteres'),
    email,
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .max(72, 'A senha deve ter no máximo 72 caracteres')
      .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra')
      .regex(/\d/, 'A senha deve conter pelo menos um número'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;
