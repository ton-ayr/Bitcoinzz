import { isValidObjectId, type Types } from 'mongoose';
import { ConflictError } from '../../shared/errors/app-error.js';
import {
  InvestmentModel,
  type InvestmentDocument,
  type InvestmentOrigin,
  type InvestmentStatus,
} from './investment.model.js';

export interface Investment {
  id: string;
  userId: string;
  btcSats: number;
  investedCents: number;
  purchasePriceCents: number;
  purchasedAt: Date;
  status: InvestmentStatus;
  closedAt?: Date;
  origin: InvestmentOrigin;
  parentId?: string;
}

export interface CreateInvestmentData {
  userId: string;
  btcSats: number;
  investedCents: number;
  purchasePriceCents: number;
  purchasedAt: Date;
  origin: InvestmentOrigin;
  parentId?: string;
}

export interface InvestmentRepository {
  create(data: CreateInvestmentData): Promise<Investment>;
  /** Investimentos OPEN do usuário, do mais antigo para o mais novo (ordem FIFO). */
  findOpenByUser(userId: string): Promise<Investment[]>;
  /** Encerra investimentos OPEN (liquidados numa venda). */
  close(ids: string[], closedAt: Date): Promise<void>;
}

type StoredInvestment = InvestmentDocument & { _id: Types.ObjectId };

function toInvestment(document: StoredInvestment): Investment {
  return {
    id: document._id.toString(),
    userId: document.userId.toString(),
    btcSats: document.btcSats,
    investedCents: document.investedCents,
    purchasePriceCents: document.purchasePriceCents,
    purchasedAt: document.purchasedAt,
    status: document.status,
    closedAt: document.closedAt ?? undefined,
    origin: document.origin,
    parentId: document.parentId?.toString(),
  };
}

export class MongooseInvestmentRepository implements InvestmentRepository {
  async create(data: CreateInvestmentData): Promise<Investment> {
    // `create([...])` com array é a forma recomendada dentro de transações.
    const [document] = await InvestmentModel.create([data]);
    return toInvestment(document!.toObject() as StoredInvestment);
  }

  async findOpenByUser(userId: string): Promise<Investment[]> {
    if (!isValidObjectId(userId)) return [];
    const documents = await InvestmentModel.find({ userId, status: 'OPEN' })
      // `_id` desempata compras feitas no mesmo milissegundo.
      .sort({ purchasedAt: 1, _id: 1 })
      .lean<StoredInvestment[]>();
    return documents.map(toInvestment);
  }

  async close(ids: string[], closedAt: Date): Promise<void> {
    const result = await InvestmentModel.updateMany(
      { _id: { $in: ids }, status: 'OPEN' },
      { $set: { status: 'CLOSED', closedAt } },
    );
    // Defesa extra: se algum já estava fechado, outra venda chegou antes. Nada é gravado.
    if (result.modifiedCount !== ids.length) {
      throw new ConflictError('Sua posição mudou durante a venda. Tente novamente.');
    }
  }
}
