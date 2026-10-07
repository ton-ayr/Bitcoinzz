import type { Express } from 'express';
import request from 'supertest';

export const fulano = { name: 'Fulano da Silva', email: 'fulano@email.com', password: 'fulano123' };

/** Cria a conta, faz login e devolve o header `Authorization` pronto para usar. */
export async function signUpAndLogin(app: Express, user = fulano): Promise<string> {
  await request(app).post('/account').send(user);
  const login = await request(app)
    .post('/login')
    .send({ email: user.email, password: user.password });
  return `Bearer ${login.body.token}`;
}
