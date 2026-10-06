import type { Request, Response } from 'express';

export class HealthController {
  constructor(private readonly isDatabaseConnected: () => boolean) {}

  // Métodos como arrow function mantêm o `this` quando passados direto para o router.
  check = (_req: Request, res: Response): void => {
    const databaseUp = this.isDatabaseConnected();

    res.status(databaseUp ? 200 : 503).json({
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'up' : 'down',
    });
  };
}
