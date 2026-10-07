import type { Logger } from '../../config/logger.js';
import { ConsoleMailer } from './console.mailer.js';
import type { Mailer } from './mailer.js';
import { SmtpMailer } from './smtp.mailer.js';

export interface MailSettings {
  from: string;
  smtp?: { host: string; port: number; user: string; pass: string };
}

/** Escolhe a implementação: SMTP se estiver configurado; senão, console. */
export function createMailer(settings: MailSettings, logger: Logger): Mailer {
  if (settings.smtp) {
    return new SmtpMailer({ ...settings.smtp, from: settings.from });
  }
  logger.warn('SMTP não configurado: os e-mails serão apenas exibidos no log');
  return new ConsoleMailer(logger);
}
