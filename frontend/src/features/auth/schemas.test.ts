import { describe, expect, it } from 'vitest';
import { loginSchema, PASSWORD_RULES, registerSchema } from './schemas';

const valid = {
  name: 'Fulano da Silva',
  email: 'fulano@email.com',
  password: 'fulano123',
  confirmPassword: 'fulano123',
};

const messagesOf = (result: ReturnType<typeof registerSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map((issue) => issue.message);

describe('schemas de autenticação (mesmas regras da API)', () => {
  it('normaliza o e-mail (espaços e maiúsculas)', () => {
    const result = loginSchema.parse({ email: '  Fulano@Email.COM ', password: 'x' });
    expect(result.email).toBe('fulano@email.com');
  });

  it('login exige e-mail válido e senha', () => {
    const result = loginSchema.safeParse({ email: 'invalido', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Informe um e-mail válido',
      'Informe a senha',
    ]);
  });

  it('cadastro válido passa', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('nome vazio pede o nome; nome curto explica o mínimo', () => {
    expect(messagesOf(registerSchema.safeParse({ ...valid, name: '  ' }))[0]).toBe(
      'Informe o nome',
    );
    expect(messagesOf(registerSchema.safeParse({ ...valid, name: 'A' }))).toEqual([
      'O nome deve ter pelo menos 2 caracteres',
    ]);
  });

  it.each([
    ['curta1', 'A senha deve ter pelo menos 8 caracteres'],
    ['semnumeros', 'A senha deve conter pelo menos um número'],
    ['12345678', 'A senha deve conter pelo menos uma letra'],
  ])('senha "%s" → %s', (password, message) => {
    const result = registerSchema.safeParse({ ...valid, password, confirmPassword: password });
    expect(messagesOf(result)).toContain(message);
  });

  it('confirmação diferente → erro no campo de confirmação', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'outra123' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirmPassword'],
      message: 'As senhas não conferem',
    });
  });

  it('regras do checklist batem com a validação', () => {
    const check = (value: string) => PASSWORD_RULES.map((rule) => rule.test(value));
    expect(check('')).toEqual([false, false, false]);
    expect(check('abc')).toEqual([false, true, false]);
    expect(check('abcdefg1')).toEqual([true, true, true]);
  });
});
