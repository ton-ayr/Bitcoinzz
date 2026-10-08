/** Formato de `GET /extract` (ver backend/docs/openapi.yaml). */

export type TransactionType = 'DEPOSIT' | 'PURCHASE' | 'SALE' | 'REINVESTMENT';

export interface StatementTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  /** null nos depósitos (não têm BTC nem cotação). */
  btcAmount: number | null;
  btcPrice: number | null;
  createdAt: string;
}

export interface Statement {
  from: string;
  to: string;
  transactions: StatementTransaction[];
}
