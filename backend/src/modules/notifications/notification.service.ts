import type { Logger } from '../../config/logger.js';
import { depositEmail, purchaseEmail, saleEmail } from './mail.templates.js';
import type { Mailer, MailMessage } from './mailer.js';

export interface Recipient {
  name: string;
  email: string;
}

/**
 * "O que" avisar ao cliente. Os envios são disparados SEM `await`:
 * a resposta HTTP não espera o servidor de e-mail, e uma falha no envio
 * nunca desfaz uma operação que já foi concluída. Falhas ficam registradas no log.
 */
export class NotificationService {
  constructor(
    private readonly mailer: Mailer,
    private readonly logger: Logger,
  ) {}

  depositConfirmed(recipient: Recipient, amountCents: number, balanceCents: number): void {
    this.dispatch({
      to: recipient.email,
      ...depositEmail(recipient.name, amountCents, balanceCents),
    });
  }

  purchaseConfirmed(
    recipient: Recipient,
    amountCents: number,
    btcSats: number,
    priceCents: number,
  ): void {
    this.dispatch({
      to: recipient.email,
      ...purchaseEmail(recipient.name, amountCents, btcSats, priceCents),
    });
  }

  saleConfirmed(recipient: Recipient, amountCents: number, btcSats: number): void {
    this.dispatch({ to: recipient.email, ...saleEmail(recipient.name, amountCents, btcSats) });
  }

  private dispatch(message: MailMessage): void {
    this.mailer.send(message).then(
      // `debug`: o próprio mailer já registra o que fez (o ConsoleMailer, por exemplo, não envia).
      () =>
        this.logger.debug({ to: message.to, subject: message.subject }, 'Notificação processada'),
      (error: unknown) =>
        this.logger.error(
          { err: error, to: message.to, subject: message.subject },
          'Falha ao enviar e-mail',
        ),
    );
  }
}
