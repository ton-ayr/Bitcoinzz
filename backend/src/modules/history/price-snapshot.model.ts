import { model, Schema, type InferSchemaType } from 'mongoose';

export const SNAPSHOT_SOURCES = ['TICKER', 'BACKFILL'] as const;
export type SnapshotSource = (typeof SNAPSHOT_SOURCES)[number];

const NINETY_DAYS_IN_SECONDS = 90 * 24 * 60 * 60;

/** Uma cotação a cada 10 minutos (08:00, 08:10, 08:20...). */
const priceSnapshotSchema = new Schema(
  {
    /** Horário do slot, sempre múltiplo de 10 minutos. */
    bucket: { type: Date, required: true },
    buyCents: { type: Number, required: true, min: 1 },
    sellCents: { type: Number, required: true, min: 1 },
    /**
     * TICKER: cotação de compra/venda coletada pelo job.
     * BACKFILL: lacuna preenchida com o preço negociado (candle); compra = venda (aproximado).
     */
    source: { type: String, enum: SNAPSHOT_SOURCES, required: true },
  },
  { versionKey: false },
);

// Um único índice com duas funções:
// - unique: no máximo um registro por slot (o job pode rodar em várias instâncias sem duplicar);
// - TTL: o próprio MongoDB apaga os registros 90 dias depois do horário do slot.
priceSnapshotSchema.index(
  { bucket: 1 },
  { unique: true, expireAfterSeconds: NINETY_DAYS_IN_SECONDS },
);

export type PriceSnapshotDocument = InferSchemaType<typeof priceSnapshotSchema>;

export const PriceSnapshotModel = model('PriceSnapshot', priceSnapshotSchema);
