import type { Request, Response } from 'express';
import { getUserId } from '../../shared/http/authenticate.js';
import { centsToReais, satsToBtc } from '../../shared/money.js';
import type { TradeInput } from './investment.schemas.js';
import type { PositionService } from './position.service.js';
import type { PurchaseService } from './purchase.service.js';
import type { SaleService } from './sale.service.js';

/** Traduz HTTP ↔ services e converte centavos/satoshis para os decimais da API. */
export class InvestmentController {
  constructor(
    private readonly purchases: PurchaseService,
    private readonly positions: PositionService,
    private readonly sales: SaleService,
  ) {}

  purchase = async (req: Request<unknown, unknown, TradeInput>, res: Response) => {
    const result = await this.purchases.purchase(getUserId(req), req.body.amountCents);
    res.status(201).json({
      amount: centsToReais(result.amountCents),
      btcAmount: satsToBtc(result.btcSats),
      btcPrice: centsToReais(result.btcPriceCents),
      balance: centsToReais(result.balanceCents),
    });
  };

  sell = async (req: Request<unknown, unknown, TradeInput>, res: Response) => {
    const result = await this.sales.sell(getUserId(req), req.body.amountCents);
    res.status(201).json({
      amount: centsToReais(result.amountCents),
      btcAmount: satsToBtc(result.btcSats),
      btcPrice: centsToReais(result.btcPriceCents),
      reinvestment: result.reinvestment && {
        amount: centsToReais(result.reinvestment.investedCents),
        btcAmount: satsToBtc(result.reinvestment.btcSats),
        btcPrice: centsToReais(result.reinvestment.btcPriceCents),
      },
      balance: centsToReais(result.balanceCents),
    });
  };

  position = async (req: Request, res: Response) => {
    const { summary, investments } = await this.positions.getPosition(getUserId(req));
    res.json({
      summary: {
        invested: centsToReais(summary.investedCents),
        btcAmount: satsToBtc(summary.btcSats),
        currentValue: centsToReais(summary.currentValueCents),
        returnPercent: summary.returnPercent,
        currentBtcPrice:
          summary.currentBtcPriceCents === null ? null : centsToReais(summary.currentBtcPriceCents),
      },
      investments: investments.map((item) => ({
        id: item.id,
        purchasedAt: item.purchasedAt.toISOString(),
        investedAmount: centsToReais(item.investedCents),
        btcAmount: satsToBtc(item.btcSats),
        btcPriceAtPurchase: centsToReais(item.purchasePriceCents),
        priceVariationPercent: item.priceVariationPercent,
        currentValue: centsToReais(item.currentValueCents),
        origin: item.origin,
      })),
    });
  };
}
