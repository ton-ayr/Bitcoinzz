import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';

/**
 * Sobe um MongoDB em memória (replica set, para suportar transações) para o arquivo de teste.
 * Entre um teste e outro, apaga os documentos mas mantém os índices (ex.: e-mail único).
 */
export function useTestDatabase(): void {
  let replSet: MongoMemoryReplSet;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await connectDatabase(replSet.getUri('bitcoinzz-test'));
    // Garante que os índices existem antes dos testes.
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  }, 120_000);

  afterEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await disconnectDatabase();
    await replSet.stop();
  });
}
