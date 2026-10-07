import type { Request, Response } from 'express';
import { centsToReais } from '../../shared/money.js';
import type { QuoteService } from './quote.service.js';

export class QuoteController {
  constructor(private readonly quotes: QuoteService) {}

  price = async (_req: Request, res: Response) => {
    const quote = await this.quotes.getCurrent();
    res.json({
      buy: centsToReais(quote.buyCents),
      sell: centsToReais(quote.sellCents),
      updatedAt: quote.fetchedAt.toISOString(),
    });
  };
}
