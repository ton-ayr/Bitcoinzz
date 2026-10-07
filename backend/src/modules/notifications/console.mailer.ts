import type { Logger } from '../../config/logger.js';
import type { Mailer, MailMessage } from './mailer.js';

/** Usado quando não há SMTP configurado: o e-mail aparece no log em vez de ser enviado. */
export class ConsoleMailer implements Mailer {
  constructor(private readonly logger: Logger) {}

  async send(message: MailMessage): Promise<void> {
    this.logger.info(
      { to: message.to, subject: message.subject },
      `[e-mail não enviado: SMTP não configurado]\n${message.text}`,
    );
  }
}
