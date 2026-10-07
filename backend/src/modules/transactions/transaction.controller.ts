import type { Request, Response } from 'express';
import { toDateOnly } from '../../shared/dates.js';
import { getUserId } from '../../shared/http/authenticate.js';
import { centsToReais, satsToBtc } from '../../shared/money.js';
import type { StatementQuery } from './statement.schemas.js';
import type { StatementService } from './statement.service.js';
import type { VolumeService } from './volume.service.js';

export class TransactionController {
  constructor(
    private readonly statements: StatementService,
    private readonly volumes: VolumeService,
  ) {}

  statement = async (req: Request<unknown, unknown, unknown, StatementQuery>, res: Response) => {
    const statement = await this.statements.getStatement(getUserId(req), req.query);
    res.json({
      from: toDateOnly(statement.from),
      to: toDateOnly(statement.to),
      transactions: statement.transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: centsToReais(transaction.amountCents),
        // Depósitos não têm BTC nem cotação: `null` mantém o formato igual para todos os tipos.
        btcAmount: transaction.btcSats === undefined ? null : satsToBtc(transaction.btcSats),
        btcPrice:
          transaction.btcPriceCents === undefined ? null : centsToReais(transaction.btcPriceCents),
        createdAt: transaction.createdAt.toISOString(),
      })),
    });
  };

  volume = async (_req: Request, res: Response) => {
    const volume = await this.volumes.getTodayVolume();
    res.json({
      date: volume.date,
      bought: satsToBtc(volume.boughtSats),
      sold: satsToBtc(volume.soldSats),
    });
  };
}
