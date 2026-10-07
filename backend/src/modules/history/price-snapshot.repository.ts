import { mongo } from 'mongoose';
import {
  PriceSnapshotModel,
  type PriceSnapshotDocument,
  type SnapshotSource,
} from './price-snapshot.model.js';

export interface PriceSnapshot {
  bucket: Date;
  buyCents: number;
  sellCents: number;
  source: SnapshotSource;
}

export interface PriceSnapshotRepository {
  /** Grava o slot se ele ainda não existir (o primeiro a gravar vence). Devolve true se gravou. */
  saveIfMissing(snapshot: PriceSnapshot): Promise<boolean>;
  /** Slots já gravados no período (inclusive). */
  findBucketsBetween(from: Date, to: Date): Promise<Date[]>;
  /** Snapshots do período, do mais antigo para o mais novo. */
  findBetween(from: Date, to: Date): Promise<PriceSnapshot[]>;
}

const DUPLICATE_KEY_ERROR = 11000;

function toSnapshot(document: PriceSnapshotDocument): PriceSnapshot {
  return {
    bucket: document.bucket,
    buyCents: document.buyCents,
    sellCents: document.sellCents,
    source: document.source,
  };
}

export class MongoosePriceSnapshotRepository implements PriceSnapshotRepository {
  async saveIfMissing(snapshot: PriceSnapshot): Promise<boolean> {
    try {
      // `$setOnInsert` + `upsert`: só escreve se o slot não existir. Rodar duas vezes não duplica.
      const result = await PriceSnapshotModel.updateOne(
        { bucket: snapshot.bucket },
        { $setOnInsert: snapshot },
        { upsert: true },
      );
      return result.upsertedCount === 1;
    } catch (error) {
      // Duas instâncias gravando o mesmo slot ao mesmo tempo: o índice único barra a segunda.
      if (error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR) {
        return false;
      }
      throw error;
    }
  }

  async findBucketsBetween(from: Date, to: Date): Promise<Date[]> {
    const documents = await PriceSnapshotModel.find(
      { bucket: { $gte: from, $lte: to } },
      { bucket: 1, _id: 0 },
    ).lean<{ bucket: Date }[]>();
    return documents.map((document) => document.bucket);
  }

  async findBetween(from: Date, to: Date): Promise<PriceSnapshot[]> {
    const documents = await PriceSnapshotModel.find({ bucket: { $gte: from, $lte: to } })
      .sort({ bucket: 1 })
      .lean<PriceSnapshotDocument[]>();
    return documents.map(toSnapshot);
  }
}
