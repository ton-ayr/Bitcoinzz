import { schedule as cronSchedule, type ScheduledTask } from 'node-cron';
import type { Logger } from '../../config/logger.js';
import { APP_TIMEZONE } from '../../shared/dates.js';
import type { HistoryService } from './history.service.js';

/** A cada 10 minutos, no minuto 0, 10, 20... (08:00, 08:10, 08:20...). */
export const HISTORY_CRON = '*/10 * * * *';

type ScheduleFn = typeof cronSchedule;

/**
 * Agenda a coleta do histórico. Erros nunca derrubam a API: só ficam no log
 * (ex.: Mercado Bitcoin fora do ar → o slot fica vazio e o backfill preenche depois).
 */
export class HistoryJob {
  private task?: ScheduledTask;

  constructor(
    private readonly history: HistoryService,
    private readonly logger: Logger,
    // Injetável: nos testes, um agendador fake dispara a tarefa sem esperar 10 minutos.
    private readonly schedule: ScheduleFn = cronSchedule,
  ) {}

  /** Agenda a coleta e, já na subida, coleta o slot atual e preenche as lacunas das últimas 24 h. */
  start(): Promise<void> {
    this.task = this.schedule(HISTORY_CRON, () => this.collect(), {
      name: 'price-history',
      timezone: APP_TIMEZONE,
      noOverlap: true, // se uma coleta demorar, a próxima não começa por cima
    });
    return this.runOnStartup();
  }

  async stop(): Promise<void> {
    await this.task?.destroy();
  }

  private async collect(): Promise<void> {
    try {
      const saved = await this.history.collectCurrent();
      this.logger.debug({ saved }, 'Histórico: cotação do slot atual coletada');
    } catch (error) {
      this.logger.warn({ err: error }, 'Histórico: falha ao coletar a cotação');
    }
  }

  private async runOnStartup(): Promise<void> {
    await this.collect();
    try {
      const filled = await this.history.backfillMissing();
      if (filled > 0) {
        this.logger.info({ filled }, 'Histórico: lacunas das últimas 24 h preenchidas');
      }
    } catch (error) {
      this.logger.warn({ err: error }, 'Histórico: falha ao preencher lacunas');
    }
  }
}
