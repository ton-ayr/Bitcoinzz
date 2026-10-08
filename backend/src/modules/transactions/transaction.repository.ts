import { isValidObjectId, type Types } from 'mongoose';
import {
  TransactionModel,
  type TransactionDocument,
  type TransactionType,
} from './transaction.model.js';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountCents: number;
  btcSats?: number;
  btcPriceCents?: number;
  createdAt: Date;
}

export interface CreateTransactionData {
  userId: string;
  type: TransactionType;
  amountCents: number;
  btcSats?: number;
  btcPriceCents?: number;
}

export interface BtcVolume {
  boughtSats: number;
  soldSats: number;
}

export interface TransactionRepository {
  create(data: CreateTransactionData): Promise<Transaction>;
  /** Lançamentos do usuário no período (inclusive), do mais recente para o mais antigo. */
  findByUserBetween(userId: string, from: Date, to: Date): Promise<Transaction[]>;
  /** Total de BTC comprado e vendido na plataforma (todos os clientes) no período. */
  sumBtcVolumeBetween(from: Date, to: Date): Promise<BtcVolume>;
}

type StoredTransaction = TransactionDocument & { _id: Types.ObjectId };

function toTransaction(document: StoredTransaction): Transaction {
  return {
    id: document._id.toString(),
    userId: document.userId.toString(),
    type: document.type,
    amountCents: document.amountCents,
    btcSats: document.btcSats ?? undefined,
    btcPriceCents: document.btcPriceCents ?? undefined,
    createdAt: document.createdAt,
  };
}

export class MongooseTransactionRepository implements TransactionRepository {
  async create(data: CreateTransactionData): Promise<Transaction> {
    // `create([...])` com array é a forma recomendada dentro de transações.
    const [document] = await TransactionModel.create([data]);
    return toTransaction(document!);
  }

  async findByUserBetween(userId: string, from: Date, to: Date): Promise<Transaction[]> {
    if (!isValidObjectId(userId)) return [];
    const documents = await TransactionModel.find({
      userId,
      createdAt: { $gte: from, $lte: to },
    })
      // Usa o índice { userId, createdAt }. O `_id` desempata lançamentos do mesmo milissegundo
      // (ex.: SALE e REINVESTMENT da mesma venda).
      .sort({ createdAt: -1, _id: -1 })
      .lean<StoredTransaction[]>();
    return documents.map(toTransaction);
  }

  async sumBtcVolumeBetween(from: Date, to: Date): Promise<BtcVolume> {
    // Reinvestimentos não entram: não são compras de mercado (regra 5 das regras de negócio do README).
    const totals = await TransactionModel.aggregate<{ _id: 'PURCHASE' | 'SALE'; sats: number }>([
      { $match: { type: { $in: ['PURCHASE', 'SALE'] }, createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$type', sats: { $sum: '$btcSats' } } },
    ]);
    const satsOf = (type: 'PURCHASE' | 'SALE') =>
      totals.find((total) => total._id === type)?.sats ?? 0;
    return { boughtSats: satsOf('PURCHASE'), soldSats: satsOf('SALE') };
  }
}
