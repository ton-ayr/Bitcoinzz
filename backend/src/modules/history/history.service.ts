import { floorToTenMinutes, lastTenMinuteSlots } from '../../shared/dates.js';
import type { CandleProvider, MinuteCandle } from '../quotes/quote.provider.js';
import type { QuoteService } from '../quotes/quote.service.js';
import type { PriceSnapshot, PriceSnapshotRepository } from './price-snapshot.repository.js';

/** 24 horas de 10 em 10 minutos. */
export const SLOTS_IN_24H = 144;
/** Quanto buscar antes da primeira lacuna: só há candle nos minutos com negociação. */
const CANDLE_LOOKBACK_MS = 3 * 60 * 60 * 1000;

/**
 * Histórico da cotação de 10 em 10 minutos (item 11 do desafio).
 * - `collectCurrent`: grava a cotação do slot atual (chamado pelo job a cada 10 min).
 * - `backfillMissing`: preenche os slots vazios das últimas 24 h (a API "dorme" no Render free).
 * - `getLast24h`: o que o endpoint devolve.
 */
export class HistoryService {
  constructor(
    private readonly snapshots: PriceSnapshotRepository,
    private readonly quotes: QuoteService,
    private readonly candles: CandleProvider,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Devolve true se gravou (false se o slot já existia). */
  async collectCurrent(): Promise<boolean> {
    const quote = await this.quotes.getCurrent();
    return this.snapshots.saveIfMissing({
      bucket: floorToTenMinutes(this.now()),
      buyCents: quote.buyCents,
      sellCents: quote.sellCents,
      source: 'TICKER',
    });
  }

  /** Preenche os slots das últimas 24 h que ficaram vazios. Devolve quantos preencheu. */
  async backfillMissing(): Promise<number> {
    // O slot atual fica de fora: ele é coletado pelo `collectCurrent` com a cotação real.
    const pastSlots = lastTenMinuteSlots(this.now(), SLOTS_IN_24H).slice(0, -1);
    const first = pastSlots[0]!;
    const last = pastSlots.at(-1)!;

    const existing = new Set(
      (await this.snapshots.findBucketsBetween(first, last)).map((bucket) => bucket.getTime()),
    );
    const missing = pastSlots.filter((slot) => !existing.has(slot.getTime()));
    if (missing.length === 0) return 0;

    const candles = await this.candles.fetchMinuteCandles(
      new Date(missing[0]!.getTime() - CANDLE_LOOKBACK_MS),
      missing.at(-1)!,
    );
    candles.sort((a, b) => a.time.getTime() - b.time.getTime());

    let filled = 0;
    for (const slot of missing) {
      const candle = lastCandleClosedBy(candles, slot);
      if (!candle) continue; // sem negociação conhecida antes deste horário

      // Candle tem só o preço negociado: compra = venda (ponto aproximado, marcado como BACKFILL).
      const saved = await this.snapshots.saveIfMissing({
        bucket: slot,
        buyCents: candle.closeCents,
        sellCents: candle.closeCents,
        source: 'BACKFILL',
      });
      if (saved) filled += 1;
    }
    return filled;
  }

  async getLast24h(): Promise<PriceSnapshot[]> {
    const now = this.now();
    const [first] = lastTenMinuteSlots(now, SLOTS_IN_24H);
    return this.snapshots.findBetween(first!, now);
  }
}

/**
 * O candle de 1 minuto que começa às 08:09 fecha às 08:10: é o último preço conhecido no slot 08:10.
 * Por isso vale o último candle que COMEÇOU antes do horário do slot.
 */
function lastCandleClosedBy(candles: MinuteCandle[], slot: Date): MinuteCandle | undefined {
  let found: MinuteCandle | undefined;
  for (const candle of candles) {
    if (candle.time.getTime() >= slot.getTime()) break;
    found = candle;
  }
  return found;
}
