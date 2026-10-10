import type { Mailer, MailMessage } from './mailer.js';

export interface MailjetSettings {
  apiKey: string;
  secretKey: string;
  /** Remetente validado na conta da Mailjet. */
  fromEmail: string;
  fromName: string;
}

const SEND_URL = 'https://api.mailjet.com/v3.1/send';
const TIMEOUT_MS = 10_000;

interface SendResponse {
  Messages?: { Status?: string; Errors?: { ErrorMessage?: string }[] }[];
  ErrorMessage?: string;
}

/**
 * Envio real pela API HTTP da Mailjet (Send API v3.1).
 * É HTTP (porta 443) e não SMTP: o plano gratuito do Render bloqueia as portas de SMTP.
 */
export class MailjetMailer implements Mailer {
  private readonly authorization: string;

  constructor(
    private readonly settings: MailjetSettings,
    private readonly fetchFn: typeof fetch = fetch,
  ) {
    const credentials = Buffer.from(`${settings.apiKey}:${settings.secretKey}`).toString('base64');
    this.authorization = `Basic ${credentials}`;
  }

  async send(message: MailMessage): Promise<void> {
    const response = await this.fetchFn(SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.authorization },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: this.settings.fromEmail, Name: this.settings.fromName },
            To: [{ Email: message.to }],
            Subject: message.subject,
            TextPart: message.text,
            HTMLPart: message.html,
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const body = (await response.json().catch(() => ({}))) as SendResponse;
    const result = body.Messages?.[0];
    if (!response.ok || result?.Status !== 'success') {
      const reason = result?.Errors?.[0]?.ErrorMessage ?? body.ErrorMessage ?? 'sem detalhes';
      throw new Error(`Mailjet recusou o envio (HTTP ${response.status}): ${reason}`);
    }
  }
}
