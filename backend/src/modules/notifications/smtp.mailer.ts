import nodemailer, { type Transporter } from 'nodemailer';
import type { Mailer, MailMessage } from './mailer.js';

export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

/** Envio real via SMTP (no projeto, o relay gratuito do Brevo: smtp-relay.brevo.com:587). */
export class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(private readonly settings: SmtpSettings) {
    this.transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      // Porta 465 usa TLS desde o início; a 587 começa sem e sobe para TLS (STARTTLS).
      secure: settings.port === 465,
      auth: { user: settings.user, pass: settings.pass },
      // Os padrões do Nodemailer chegam a 10 minutos; aqui falhamos rápido.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({ from: this.settings.from, ...message });
  }
}
