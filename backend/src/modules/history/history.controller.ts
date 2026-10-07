import type { Request, Response } from 'express';
import { centsToReais } from '../../shared/money.js';
import type { HistoryService } from './history.service.js';

export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  last24h = async (_req: Request, res: Response) => {
    const snapshots = await this.history.getLast24h();
    res.json(
      snapshots.map((snapshot) => ({
        timestamp: snapshot.bucket.toISOString(),
        buy: centsToReais(snapshot.buyCents),
        sell: centsToReais(snapshot.sellCents),
        source: snapshot.source,
      })),
    );
  };
}
