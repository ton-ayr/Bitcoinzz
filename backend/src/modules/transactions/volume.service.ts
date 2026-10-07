import { endOfDay, startOfDay, toDateOnly } from '../../shared/dates.js';
import type { TransactionRepository } from './transaction.repository.js';

export interface DailyVolume {
  /** Dia de referência ("AAAA-MM-DD", horário de São Paulo). */
  date: string;
  boughtSats: number;
  soldSats: number;
}

/** Volume: total de BTC comprado e vendido na plataforma no dia corrente (regra 5 do PRD). */
export class VolumeService {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getTodayVolume(): Promise<DailyVolume> {
    const today = this.now();
    const volume = await this.transactions.sumBtcVolumeBetween(startOfDay(today), endOfDay(today));
    return { date: toDateOnly(today), ...volume };
  }
}
