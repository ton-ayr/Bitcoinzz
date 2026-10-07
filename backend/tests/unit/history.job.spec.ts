import type { ScheduledTask } from 'node-cron';
import { describe, expect, it, vi } from 'vitest';
import { HISTORY_CRON, HistoryJob } from '../../src/modules/history/history.job.js';
import type { HistoryService } from '../../src/modules/history/history.service.js';
import { silentLogger } from '../helpers/test-app.js';

function setup(
  overrides: Partial<Record<'collectCurrent' | 'backfillMissing', () => Promise<unknown>>> = {},
) {
  const history = {
    collectCurrent: vi.fn(overrides.collectCurrent ?? (async () => true)),
    backfillMissing: vi.fn(overrides.backfillMissing ?? (async () => 0)),
  };
  const task = { destroy: vi.fn() };
  let scheduledFn: (() => unknown) | undefined;
  // Agendador fake: guarda a função em vez de esperar 10 minutos.
  const schedule = vi.fn((_expression: string, fn: () => unknown) => {
    scheduledFn = fn;
    return task as unknown as ScheduledTask;
  });
  const logger = { ...silentLogger, warn: vi.fn(), info: vi.fn(), debug: vi.fn() };
  const job = new HistoryJob(
    history as unknown as HistoryService,
    logger as unknown as typeof silentLogger,
    schedule as never,
  );
  return { history, task, schedule, logger, job, tick: () => scheduledFn?.() };
}

describe('HistoryJob', () => {
  it('agenda a cada 10 minutos, no fuso de São Paulo, sem execuções sobrepostas', async () => {
    const { job, schedule } = setup();
    await job.start();
    expect(HISTORY_CRON).toBe('*/10 * * * *');
    expect(schedule).toHaveBeenCalledWith(HISTORY_CRON, expect.any(Function), {
      name: 'price-history',
      timezone: 'America/Sao_Paulo',
      noOverlap: true,
    });
  });

  it('na subida, coleta o slot atual e depois preenche as lacunas', async () => {
    const { job, history } = setup();
    await job.start();
    expect(history.collectCurrent).toHaveBeenCalledOnce();
    expect(history.backfillMissing).toHaveBeenCalledOnce();
  });

  it('a cada disparo do agendador, coleta a cotação', async () => {
    const { job, history, tick } = setup();
    await job.start();
    await tick();
    await tick();
    expect(history.collectCurrent).toHaveBeenCalledTimes(3); // subida + 2 disparos
  });

  it('erros viram aviso no log e nunca derrubam a API', async () => {
    const { job, logger, tick } = setup({
      collectCurrent: async () => Promise.reject(new Error('Mercado Bitcoin fora')),
      backfillMissing: async () => Promise.reject(new Error('candles fora')),
    });
    await expect(job.start()).resolves.toBeUndefined();
    await expect(tick()).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledTimes(3);
  });

  it('stop encerra a tarefa agendada', async () => {
    const { job, task } = setup();
    await job.start();
    await job.stop();
    expect(task.destroy).toHaveBeenCalledOnce();
  });
});
