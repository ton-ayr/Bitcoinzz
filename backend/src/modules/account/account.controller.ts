import type { Request, Response } from 'express';
import { getUserId } from '../../shared/http/authenticate.js';
import { centsToReais } from '../../shared/money.js';
import type { DepositInput } from './account.schemas.js';
import type { AccountService } from './account.service.js';

export class AccountController {
  constructor(private readonly account: AccountService) {}

  profile = async (req: Request, res: Response) => {
    const user = await this.account.getProfile(getUserId(req));
    res.json({ id: user.id, name: user.name, email: user.email });
  };

  deposit = async (req: Request<unknown, unknown, DepositInput>, res: Response) => {
    const { balanceCents } = await this.account.deposit(getUserId(req), req.body.amountCents);
    res.status(201).json({ balance: centsToReais(balanceCents) });
  };

  balance = async (req: Request, res: Response) => {
    const balanceCents = await this.account.getBalance(getUserId(req));
    res.json({ balance: centsToReais(balanceCents) });
  };
}
