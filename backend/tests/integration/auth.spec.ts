import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../../src/modules/auth/password-hasher.js';
import { JwtTokenService } from '../../src/modules/auth/token-service.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { createAuthenticate, getUserId } from '../../src/shared/http/authenticate.js';
import { createErrorHandler } from '../../src/shared/http/error-handler.js';
import { useTestDatabase } from '../helpers/database.js';
import { createTestApp, silentLogger, TEST_JWT_SECRET } from '../helpers/test-app.js';

useTestDatabase();

// Custo 4 só para os testes ficarem rápidos (em produção é 10).
const newApp = () => createTestApp({ passwordHasher: new BcryptPasswordHasher(4) });

const fulano = { name: 'Fulano da Silva', email: 'fulano@email.com', password: 'fulano123' };

describe('POST /account', () => {
  it('201: cria a conta e não devolve a senha', async () => {
    const response = await request(newApp()).post('/account').send(fulano);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: fulano.name,
      email: fulano.email,
    });

    const stored = await UserModel.findOne({ email: fulano.email }).select('+passwordHash').lean();
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/); // formato de hash bcrypt
    expect(stored?.passwordHash).not.toContain(fulano.password);
    expect(stored?.balanceCents).toBe(0);
  });

  it('normaliza o e-mail (espaços e maiúsculas)', async () => {
    const response = await request(newApp())
      .post('/account')
      .send({ ...fulano, email: '  Fulano@Email.COM ' });
    expect(response.body.email).toBe('fulano@email.com');
  });

  it('409: e-mail já cadastrado (sem diferenciar maiúsculas)', async () => {
    const app = newApp();
    await request(app).post('/account').send(fulano);
    const response = await request(app)
      .post('/account')
      .send({ ...fulano, email: 'FULANO@email.com' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ statusCode: 409, message: 'Este e-mail já está cadastrado' });
  });

  it.each([
    [{ ...fulano, name: '' }, 'name', 'O nome deve ter pelo menos 2 caracteres'],
    [{ ...fulano, email: 'invalido' }, 'email', 'Informe um e-mail válido'],
    [{ ...fulano, password: 'curta1' }, 'password', 'A senha deve ter pelo menos 8 caracteres'],
    [{ ...fulano, password: 'semnumeros' }, 'password', 'A senha deve conter pelo menos um número'],
    [{ ...fulano, password: '12345678' }, 'password', 'A senha deve conter pelo menos uma letra'],
    [{ email: fulano.email, password: fulano.password }, 'name', 'Informe o nome'],
  ])('400: %o → %s', async (body, field, message) => {
    const response = await request(newApp()).post('/account').send(body);
    expect(response.status).toBe(400);
    expect(response.body.details).toContainEqual({ field, message });
  });
});

describe('POST /login', () => {
  async function appWithUser() {
    const app = newApp();
    await request(app).post('/account').send(fulano);
    return app;
  }

  it('200: devolve um token válido', async () => {
    const app = await appWithUser();
    const response = await request(app)
      .post('/login')
      .send({ email: fulano.email, password: fulano.password });

    expect(response.status).toBe(200);
    const userId = new JwtTokenService(TEST_JWT_SECRET, '8h').verify(response.body.token);
    expect(userId).toHaveLength(24); // ObjectId do MongoDB
  });

  it('401: senha errada e e-mail inexistente têm a MESMA resposta', async () => {
    const app = await appWithUser();
    const wrongPassword = await request(app)
      .post('/login')
      .send({ email: fulano.email, password: 'errada123' });
    const unknownEmail = await request(app)
      .post('/login')
      .send({ email: 'ninguem@email.com', password: 'errada123' });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body).toEqual({ statusCode: 401, message: 'E-mail ou senha inválidos' });
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('429: bloqueia após 10 senhas erradas para o mesmo e-mail, sem afetar outros e-mails', async () => {
    const app = await appWithUser();
    const attempt = (email: string) =>
      request(app).post('/login').send({ email, password: 'errada123' });

    for (let i = 0; i < 10; i += 1) {
      expect((await attempt(fulano.email)).status).toBe(401);
    }
    const blocked = await attempt(fulano.email);
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Muitas tentativas/);

    // Outro e-mail continua podendo tentar.
    expect((await attempt('outra@email.com')).status).toBe(401);
  });

  it('acertos não contam para o limite', async () => {
    const app = await appWithUser();
    for (let i = 0; i < 12; i += 1) {
      const response = await request(app)
        .post('/login')
        .send({ email: fulano.email, password: fulano.password });
      expect(response.status).toBe(200);
    }
  });
});

describe('middleware authenticate', () => {
  const tokens = new JwtTokenService(TEST_JWT_SECRET, '8h');
  const app = express();
  app.get('/protegida', createAuthenticate(tokens), (req, res) => {
    res.json({ userId: getUserId(req) });
  });
  app.use(createErrorHandler(silentLogger));

  it('200 com token válido e req.userId preenchido', async () => {
    const response = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${tokens.sign('abc123')}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'abc123' });
  });

  it.each([
    ['sem header', undefined, 'Token de acesso não informado'],
    ['esquema errado', `Basic ${tokens.sign('abc123')}`, 'Token de acesso não informado'],
    ['token inválido', 'Bearer xyz', 'Token inválido'],
  ])('401 %s', async (_case, header, message) => {
    const call = request(app).get('/protegida');
    const response = header ? await call.set('Authorization', header) : await call;
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ statusCode: 401, message });
  });
});
