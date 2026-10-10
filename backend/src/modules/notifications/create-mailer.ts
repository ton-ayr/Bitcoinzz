import type { Logger } from '../../config/logger.js';
import { ConsoleMailer } from './console.mailer.js';
import type { Mailer } from './mailer.js';
import { MailjetMailer, type MailjetSettings } from './mailjet.mailer.js';

export interface MailSettings {
  mailjet?: MailjetSettings;
}

/** Escolhe a implementação: Mailjet se estiver configurada; senão, console. */
export function createMailer(settings: MailSettings, logger: Logger): Mailer {
  if (settings.mailjet) {
    return new MailjetMailer(settings.mailjet);
  }
  logger.warn('Mailjet não configurada: os e-mails serão apenas exibidos no log');
  return new ConsoleMailer(logger);
}
