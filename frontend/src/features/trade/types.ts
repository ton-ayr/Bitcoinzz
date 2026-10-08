/** Respostas das operações (ver backend/docs/openapi.yaml). */

export interface DepositResult {
  balance: number;
}

export interface PurchaseResult {
  amount: number;
  btcAmount: number;
  btcPrice: number;
  balance: number;
}

export interface SaleResult {
  amount: number;
  btcAmount: number;
  /** Cotação de compra usada na venda. */
  btcPrice: number;
  /** Sobra da venda parcial, que continua investida (cotação original). */
  reinvestment: { amount: number; btcAmount: number; btcPrice: number } | null;
  balance: number;
}
