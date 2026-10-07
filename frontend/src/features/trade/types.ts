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
