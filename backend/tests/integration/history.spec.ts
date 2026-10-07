import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PriceSnapshotModel } from '../../src/modules/history/price-snapshot.model.js';
import { MongoosePriceSnapshotRepository } from '../../src/modules/history/price-snapshot.repository.js';
import { floorToTenMinutes, TEN_MINUTES_MS } from '../../src/shared/dates.js';
import { signUpAndLogin } from '../helpers/auth.js';
import { useTestDatabase } from '../helpers/database.js';
import { createTestApp } from '../helpers/test-app.js';

useTestDatabase();

const repository = new MongoosePriceSnapshotRepository();
const currentSlot = () => floorToTenMinutes(new Date());
const slotsAgo = (count: number) => new Date(currentSlot().getTime() - count * TEN_MINUTES_MS);

describe('GET /history', () => {
  it('401 sem token', async () => {
    expect((await request(createTestApp()).get('/history')).status).toBe(401);
  });

  it('devolve as últimas 24 h (até 144 pontos de 10 em 10 min), em ordem crescente', async () => {
    const app = createTestApp();
    const auth = await signUpAndLogin(app);
    await repository.saveIfMissing({
      bucket: currentSlot(),
      buyCents: 42_725_300,
      sellCents: 42_725_400,
      source: 'TICKER',
    });
    await repository.saveIfMissing({
      bucket: slotsAgo(143), // primeiro slot da janela de 24 h
      buyCents: 42_000_000,
      sellCents: 42_000_000,
      source: 'BACKFILL',
    });
    await repository.saveIfMissing({
      bucket: slotsAgo(144), // 24 h atrás: fora da janela
      buyCents: 1,
      sellCents: 1,
      source: 'TICKER',
    });

    const response = await request(app).get('/history').set('Authorization', auth);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { timestamp: slotsAgo(143).toISOString(), buy: 420000, sell: 420000, source: 'BACKFILL' },
      { timestamp: currentSlot().toISOString(), buy: 427253, sell: 427254, source: 'TICKER' },
    ]);
  });
});

describe('coleção de histórico no MongoDB', () => {
  it('índice único + TTL de 90 dias no horário do slot', async () => {
    const indexes = await PriceSnapshotModel.collection.indexes();
    expect(indexes.find((index) => index.name === 'bucket_1')).toMatchObject({
      unique: true,
      expireAfterSeconds: 90 * 24 * 60 * 60,
    });
  });

  it('5 gravações simultâneas do mesmo slot (ex.: 5 instâncias) → 1 registro', async () => {
    const snapshot = {
      bucket: currentSlot(),
      buyCents: 1,
      sellCents: 1,
      source: 'TICKER' as const,
    };
    const results = await Promise.all(
      Array.from({ length: 5 }, () => repository.saveIfMissing(snapshot)),
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await PriceSnapshotModel.countDocuments()).toBe(1);
  });
});
