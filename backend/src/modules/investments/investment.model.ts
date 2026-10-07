import { model, Schema, type InferSchemaType } from 'mongoose';

export const INVESTMENT_STATUSES = ['OPEN', 'CLOSED'] as const;
export const INVESTMENT_ORIGINS = ['PURCHASE', 'REINVESTMENT'] as const;
export type InvestmentStatus = (typeof INVESTMENT_STATUSES)[number];
export type InvestmentOrigin = (typeof INVESTMENT_ORIGINS)[number];

/**
 * Cada compra vira um investimento. A posição do cliente é a lista dos investimentos OPEN,
 * e a venda consome esses investimentos do mais antigo para o mais novo (FIFO).
 */
const investmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    btcSats: { type: Number, required: true, min: 1 },
    investedCents: { type: Number, required: true, min: 0 },
    /** Cotação (centavos por 1 BTC) no momento da compra. */
    purchasePriceCents: { type: Number, required: true, min: 1 },
    /** Data da compra: define a ordem FIFO da venda. */
    purchasedAt: { type: Date, required: true },
    status: { type: String, enum: INVESTMENT_STATUSES, required: true, default: 'OPEN' },
    closedAt: { type: Date },
    origin: { type: String, enum: INVESTMENT_ORIGINS, required: true, default: 'PURCHASE' },
    /** Em um reinvestimento: o investimento original que foi liquidado. */
    parentId: { type: Schema.Types.ObjectId, ref: 'Investment' },
  },
  { versionKey: false },
);

// Posição do cliente e fila FIFO da venda: investimentos OPEN por data de compra.
investmentSchema.index({ userId: 1, status: 1, purchasedAt: 1 });

export type InvestmentDocument = InferSchemaType<typeof investmentSchema>;

export const InvestmentModel = model('Investment', investmentSchema);
