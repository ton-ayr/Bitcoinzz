import type { Logger } from '../../config/logger.js';
import type { Mailer, MailMessage } from './mailer.js';

/** Usado quando a Mailjet não está configurada: o e-mail aparece no log em vez de ser enviado. */
export class ConsoleMailer implements Mailer {
  constructor(private readonly logger: Logger) {}

  async send(message: MailMessage): Promise<void> {
    this.logger.info(
      { to: message.to, subject: message.subject },
      `[e-mail não enviado: Mailjet não configurada]\n${message.text}`,
    );
  }
}
