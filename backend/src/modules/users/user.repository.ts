import { isValidObjectId, mongo, type Types } from 'mongoose';
import { ConflictError } from '../../shared/errors/app-error.js';
import { UserModel, type UserDocument } from './user.model.js';

/** Usuário como o resto da aplicação enxerga: objeto simples, sem nada do Mongoose. */
export interface User {
  id: string;
  name: string;
  email: string;
  balanceCents: number;
  createdAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

/** O contrato que os services conhecem. Nos testes unitários, usamos uma versão em memória. */
export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  /** Soma (ou subtrai, se negativo) do saldo de forma atômica. Devolve o usuário atualizado. */
  incrementBalance(id: string, deltaCents: number): Promise<User | null>;
  /**
   * Debita o saldo SOMENTE se houver saldo suficiente, numa única operação atômica.
   * Devolve `null` se o saldo não bastar (ou se o usuário não existir).
   */
  debitBalance(id: string, amountCents: number): Promise<User | null>;
}

type StoredUser = UserDocument & { _id: Types.ObjectId };

function toUser(document: StoredUser): User {
  return {
    id: document._id.toString(),
    name: document.name,
    email: document.email,
    balanceCents: document.balanceCents,
    createdAt: document.createdAt,
  };
}

const DUPLICATE_KEY_ERROR = 11000;

export class MongooseUserRepository implements UserRepository {
  async create(data: CreateUserData): Promise<User> {
    try {
      const document = await UserModel.create(data);
      return toUser(document);
    } catch (error) {
      // O índice único em `email` garante que não haverá duplicidade,
      // mesmo com dois cadastros simultâneos.
      if (error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR) {
        throw new ConflictError('Este e-mail já está cadastrado');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) return null;
    const document = await UserModel.findById(id).lean<StoredUser>();
    return document ? toUser(document) : null;
  }

  async incrementBalance(id: string, deltaCents: number): Promise<User | null> {
    if (!isValidObjectId(id)) return null;
    // `$inc` é atômico no MongoDB: dois depósitos simultâneos nunca "se perdem".
    const document = await UserModel.findByIdAndUpdate(
      id,
      { $inc: { balanceCents: deltaCents } },
      { returnDocument: 'after' },
    ).lean<StoredUser>();
    return document ? toUser(document) : null;
  }

  async debitBalance(id: string, amountCents: number): Promise<User | null> {
    if (!isValidObjectId(id)) return null;
    // A condição `balanceCents >= valor` e o débito acontecem juntos no banco:
    // duas compras simultâneas nunca deixam o saldo negativo.
    const document = await UserModel.findOneAndUpdate(
      { _id: id, balanceCents: { $gte: amountCents } },
      { $inc: { balanceCents: -amountCents } },
      { returnDocument: 'after' },
    ).lean<StoredUser>();
    return document ? toUser(document) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const document = await UserModel.findOne({ email }).select('+passwordHash').lean<StoredUser>();
    return document ? { ...toUser(document), passwordHash: document.passwordHash } : null;
  }
}
