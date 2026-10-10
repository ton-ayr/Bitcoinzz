import { describe, expect, it, vi } from 'vitest';
import { MailjetMailer } from '../../src/modules/notifications/mailjet.mailer.js';

const settings = {
  apiKey: 'chave',
  secretKey: 'segredo',
  fromEmail: 'eu@gmail.com',
  fromName: 'Bitcoinzz',
};
const message = {
  to: 'cliente@email.com',
  subject: 'Assunto',
  text: 'Texto',
  html: '<p>Texto</p>',
};

function fakeFetch(status: number, body: unknown) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    Response.json(body, { status }),
  );
}

describe('MailjetMailer', () => {
  it('envia pela Send API v3.1 com autenticação Basic e o formato da Mailjet', async () => {
    const fetchFn = fakeFetch(200, { Messages: [{ Status: 'success' }] });
    await new MailjetMailer(settings, fetchFn as unknown as typeof fetch).send(message);

    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.mailjet.com/v3.1/send');
    expect(init?.method).toBe('POST');
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('chave:segredo').toString('base64')}`);
    expect(JSON.parse(String(init?.body))).toEqual({
      Messages: [
        {
          From: { Email: 'eu@gmail.com', Name: 'Bitcoinzz' },
          To: [{ Email: 'cliente@email.com' }],
          Subject: 'Assunto',
          TextPart: 'Texto',
          HTMLPart: '<p>Texto</p>',
        },
      ],
    });
  });

  it('chave inválida (401) vira erro com o motivo', async () => {
    const fetchFn = fakeFetch(401, {
      ErrorMessage: 'API key authentication/authorization failure',
    });
    await expect(
      new MailjetMailer(settings, fetchFn as unknown as typeof fetch).send(message),
    ).rejects.toThrow(
      'Mailjet recusou o envio (HTTP 401): API key authentication/authorization failure',
    );
  });

  it('remetente não validado (status "error" na mensagem) vira erro com o motivo', async () => {
    const fetchFn = fakeFetch(403, {
      Messages: [{ Status: 'error', Errors: [{ ErrorMessage: 'Sender is not authorized' }] }],
    });
    await expect(
      new MailjetMailer(settings, fetchFn as unknown as typeof fetch).send(message),
    ).rejects.toThrow('Mailjet recusou o envio (HTTP 403): Sender is not authorized');
  });
});
