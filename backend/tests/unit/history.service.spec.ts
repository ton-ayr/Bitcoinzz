import { beforeEach, describe, expect, it } from 'vitest';
import { HistoryService } from '../../src/modules/history/history.service.js';
import { QuoteService } from '../../src/modules/quotes/quote.service.js';
import { lastTenMinuteSlots } from '../../src/shared/dates.js';
import { ServiceUnavailableError } from '../../src/shared/errors/app-error.js';
import {
  FakeCandleProvider,
  FakeQuoteProvider,
  InMemoryPriceSnapshotRepository,
} from '../helpers/fakes.js';

// Agora: 12:05 UTC → slot atual 12:00; as 24 h vão de 05/10 12:10 até 06/10 12:00 (144 slots).
const NOW = new Date('2026-10-06T12:05:00Z');
const at = (iso: string) => new Date(iso);
const candle = (iso: string, closeCents: number) => ({ time: at(iso), closeCents });

describe('HistoryService', () => {
  let snapshots: InMemoryPriceSnapshotRepository;
  let candles: FakeCandleProvider;
  let service: HistoryService;

  beforeEach(() => {
    snapshots = new InMemoryPriceSnapshotRepository();
    candles = new FakeCandleProvider();
    service = new HistoryService(
      snapshots,
      new QuoteService(new FakeQuoteProvider(42_725_300, 42_725_400), 10_000),
      candles,
      () => NOW,
    );
  });

  /** Preenche os slots passados das últimas 24 h, menos os informados. */
  async function fillPastSlotsExcept(...missing: string[]) {
    const skip = new Set(missing.map((iso) => at(iso).getTime()));
    for (const slot of lastTenMinuteSlots(NOW, 144).slice(0, -1)) {
      if (!skip.has(slot.getTime())) {
        await snapshots.saveIfMissing({
          bucket: slot,
          buyCents: 1,
          sellCents: 1,
          source: 'TICKER',
        });
      }
    }
  }

  describe('collectCurrent', () => {
    it('grava a cotação de compra e venda no slot atual (arredondado para 10 min)', async () => {
      expect(await service.collectCurrent()).toBe(true);
      expect(snapshots.snapshots).toEqual([
        {
          bucket: at('2026-10-06T12:00:00Z'),
          buyCents: 42_725_300,
          sellCents: 42_725_400,
          source: 'TICKER',
        },
      ]);
    });

    it('é idempotente: rodar de novo no mesmo slot não duplica', async () => {
      await service.collectCurrent();
      expect(await service.collectCurrent()).toBe(false);
      expect(snapshots.snapshots).toHaveLength(1);
    });
  });

  describe('backfillMissing', () => {
    it('preenche SÓ as lacunas, com o último candle fechado antes de cada horário', async () => {
      await fillPastSlotsExcept(
        '2026-10-05T12:10:00Z',
        '2026-10-06T08:00:00Z',
        '2026-10-06T11:50:00Z',
      );
      candles.candles = [
        candle('2026-10-05T11:00:00Z', 100_000_00),
        candle('2026-10-06T07:58:00Z', 200_000_00),
        // Começa às 08:00 e fecha às 08:01: ainda não existia no horário 08:00.
        candle('2026-10-06T08:00:00Z', 999_999_99),
        candle('2026-10-06T11:49:00Z', 300_000_00),
      ];

      const filled = await service.backfillMissing();

      expect(filled).toBe(3);
      const backfilled = snapshots.snapshots.filter((snapshot) => snapshot.source === 'BACKFILL');
      expect(backfilled).toEqual([
        {
          bucket: at('2026-10-05T12:10:00Z'),
          buyCents: 100_000_00,
          sellCents: 100_000_00,
          source: 'BACKFILL',
        },
        {
          bucket: at('2026-10-06T08:00:00Z'),
          buyCents: 200_000_00,
          sellCents: 200_000_00,
          source: 'BACKFILL',
        },
        {
          bucket: at('2026-10-06T11:50:00Z'),
          buyCents: 300_000_00,
          sellCents: 300_000_00,
          source: 'BACKFILL',
        },
      ]);
      // Uma única chamada à API de candles, começando 3 h antes da primeira lacuna.
      expect(candles.calls).toEqual([
        { from: at('2026-10-05T09:10:00Z'), to: at('2026-10-06T11:50:00Z') },
      ]);
    });

    it('nada faltando → não chama a API de candles', async () => {
      await fillPastSlotsExcept();
      expect(await service.backfillMissing()).toBe(0);
      expect(candles.calls).toHaveLength(0);
    });

    it('não preenche o slot atual (ele é coletado com a cotação real)', async () => {
      await fillPastSlotsExcept();
      candles.candles = [candle('2026-10-06T11:59:00Z', 1)];
      await service.backfillMissing();
      expect(
        snapshots.snapshots.some(
          (s) => s.bucket.getTime() === at('2026-10-06T12:00:00Z').getTime(),
        ),
      ).toBe(false);
    });

    it('slots sem nenhuma negociação conhecida antes deles ficam vazios', async () => {
      // Tudo vazio; o único candle é de 06/10 00:00 → só os slots de 00:10 a 11:50 (71) têm preço.
      candles.candles = [candle('2026-10-06T00:00:00Z', 123_45)];
      expect(await service.backfillMissing()).toBe(71);
    });

    it('falha da API de candles é repassada (o job registra no log)', async () => {
      candles.failure = new ServiceUnavailableError('fora do ar');
      await expect(service.backfillMissing()).rejects.toBeInstanceOf(ServiceUnavailableError);
    });
  });

  describe('getLast24h', () => {
    it('devolve só as últimas 24 h, em ordem crescente', async () => {
      const save = (iso: string) =>
        snapshots.saveIfMissing({ bucket: at(iso), buyCents: 1, sellCents: 1, source: 'TICKER' });
      await save('2026-10-06T12:00:00Z');
      await save('2026-10-05T12:00:00Z'); // 24 h e 5 min atrás: fora
      await save('2026-10-05T12:10:00Z'); // primeiro slot da janela: dentro

      const history = await service.getLast24h();

      expect(history.map((snapshot) => snapshot.bucket.toISOString())).toEqual([
        '2026-10-05T12:10:00.000Z',
        '2026-10-06T12:00:00.000Z',
      ]);
    });
  });
});
