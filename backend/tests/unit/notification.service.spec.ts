import { describe, expect, it, vi } from 'vitest';
import { createMailer } from '../../src/modules/notifications/create-mailer.js';
import { ConsoleMailer } from '../../src/modules/notifications/console.mailer.js';
import { depositEmail, welcomeEmail } from '../../src/modules/notifications/mail.templates.js';
import type { Mailer } from '../../src/modules/notifications/mailer.js';
import { NotificationService } from '../../src/modules/notifications/notification.service.js';
import { MailjetMailer } from '../../src/modules/notifications/mailjet.mailer.js';
import { formatBRL, formatBTC } from '../../src/shared/format.js';
import { FakeMailer } from '../helpers/fakes.js';
import { silentLogger } from '../helpers/test-app.js';

const fulano = { name: 'Fulano', email: 'fulano@email.com' };

describe('format', () => {
  it('formata R$ e BTC em pt-BR', () => {
    expect(formatBRL(8750)).toBe('R$ 87,50');
    expect(formatBRL(123456789)).toBe('R$ 1.234.567,89');
    expect(formatBTC(120000)).toBe('0,00120000 BTC');
  });
});

describe('welcomeEmail', () => {
  const appUrl = 'https://bitcoinzz.vercel.app';

  it('avisa que a conta foi criada e lembra o e-mail de login', () => {
    const email = welcomeEmail('Fulano', 'fulano@email.com', appUrl);
    expect(email.subject).toBe('Sua conta no Bitcoinzz foi criada');
    expect(email.text).toContain('Sua conta foi criada com sucesso.');
    expect(email.text).toContain('use o e-mail fulano@email.com');
    expect(email.text).toContain('Se não foi você que criou esta conta, ignore este e-mail.');
  });

  it('com APP_URL: botão no HTML e link no texto', () => {
    const email = welcomeEmail('Fulano', 'fulano@email.com', appUrl);
    expect(email.html).toContain(`href="${appUrl}"`);
    expect(email.html).toContain('Acessar o Bitcoinzz');
    expect(email.text).toContain(`Acesse: ${appUrl}`);
  });

  it('sem APP_URL: sai sem o botão', () => {
    const email = welcomeEmail('Fulano', 'fulano@email.com');
    expect(email.html).not.toContain('href=');
    expect(email.text).not.toContain('Acesse:');
  });

  it('escapa HTML no nome do cliente', () => {
    const email = welcomeEmail('<b>Fulano</b>', 'fulano@email.com');
    expect(email.html).not.toContain('<b>Fulano</b>');
    expect(email.html).toContain('&lt;b&gt;Fulano&lt;/b&gt;');
  });
});

describe('depositEmail', () => {
  it('informa o valor depositado e o saldo', () => {
    const email = depositEmail('Fulano', 8750, 18750);
    expect(email.subject).toBe('Depósito de R$ 87,50 confirmado');
    expect(email.text).toContain('Seu depósito de R$ 87,50 foi confirmado.');
    expect(email.text).toContain('Saldo disponível: R$ 187,50.');
  });

  it('escapa HTML no nome do cliente', () => {
    const email = depositEmail('<script>alert(1)</script>', 100, 100);
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});

describe('NotificationService', () => {
  it('envia o e-mail de depósito para o cliente', async () => {
    const mailer = new FakeMailer();
    new NotificationService(mailer, silentLogger).depositConfirmed(fulano, 8750, 8750);
    await vi.waitFor(() => expect(mailer.sent).toHaveLength(1));
    expect(mailer.sent[0]).toMatchObject({ to: fulano.email, subject: expect.any(String) });
  });

  it('envia o e-mail de boas-vindas com o botão para o admin', async () => {
    const mailer = new FakeMailer();
    new NotificationService(mailer, silentLogger, 'https://bitcoinzz.vercel.app').accountCreated(
      fulano,
    );
    await vi.waitFor(() => expect(mailer.sent).toHaveLength(1));
    expect(mailer.sent[0]?.to).toBe(fulano.email);
    expect(mailer.sent[0]?.html).toContain('href="https://bitcoinzz.vercel.app"');
  });

  it('não espera o envio: volta na hora mesmo com um servidor de e-mail travado', () => {
    const stuckMailer: Mailer = { send: () => new Promise(() => {}) };
    const service = new NotificationService(stuckMailer, silentLogger);
    expect(() => service.depositConfirmed(fulano, 100, 100)).not.toThrow();
  });

  it('falha no envio é logada e não vira erro para quem chamou', async () => {
    const failingMailer: Mailer = { send: () => Promise.reject(new Error('Mailjet fora do ar')) };
    const logger = {
      ...silentLogger,
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as typeof silentLogger;

    new NotificationService(failingMailer, logger).depositConfirmed(fulano, 100, 100);

    await vi.waitFor(() => expect(logger.error).toHaveBeenCalledOnce());
  });
});

describe('createMailer', () => {
  it('sem Mailjet → console', () => {
    expect(createMailer({}, silentLogger)).toBeInstanceOf(ConsoleMailer);
  });

  it('com Mailjet → envio real', () => {
    const mailer = createMailer(
      { mailjet: { apiKey: 'k', secretKey: 's', fromEmail: 'x@y.com', fromName: 'Bitcoinzz' } },
      silentLogger,
    );
    expect(mailer).toBeInstanceOf(MailjetMailer);
  });
});
