export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * "Como" enviar um e-mail. Há duas implementações: Mailjet (API HTTP) e console (desenvolvimento).
 * Quem envia não sabe qual está em uso: trocar de provedor é só trocar a implementação.
 */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}
