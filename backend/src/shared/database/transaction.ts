import mongoose from 'mongoose';

/**
 * Executa um bloco de código dentro de uma transação: ou tudo é gravado, ou nada é.
 * Os services dependem desta interface (e não do Mongoose), o que permite usar
 * uma versão fake nos testes unitários.
 */
export interface TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export class MongooseTransactionRunner implements TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    // `connection.transaction` faz commit no sucesso, abort em erro e
    // repete automaticamente em erros transitórios (ex.: conflito de escrita).
    return mongoose.connection.transaction(() => work());
  }
}
