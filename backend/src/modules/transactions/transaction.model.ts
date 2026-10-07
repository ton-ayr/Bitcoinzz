import { model, Schema, type InferSchemaType } from 'mongoose';

export const TRANSACTION_TYPES = ['DEPOSIT', 'PURCHASE', 'SALE', 'REINVESTMENT'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Cada lançamento do extrato. Valores em inteiros: centavos e satoshis. */
const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amountCents: { type: Number, required: true, min: 0 },
    // Só em compra, venda e reinvestimento:
    btcSats: { type: Number, min: 0 },
    btcPriceCents: { type: Number, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

// Extrato do cliente por período (mais recentes primeiro) e volume do dia por tipo.
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: 1 });

export type TransactionDocument = InferSchemaType<typeof transactionSchema>;

// Coleção "transactions": não colide com a "transacoes" da v1.
export const TransactionModel = model('Transaction', transactionSchema);
