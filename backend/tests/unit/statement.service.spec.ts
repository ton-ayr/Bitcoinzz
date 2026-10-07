import { beforeEach, describe, expect, it } from 'vitest';
import { StatementService } from '../../src/modules/transactions/statement.service.js';
import { VolumeService } from '../../src/modules/transactions/volume.service.js';
import { BadRequestError } from '../../src/shared/errors/app-error.js';
import { InMemoryTransactionRepository } from '../helpers/fakes.js';

// 06/10/2026 às 12:00 em São Paulo (UTC−3).
const NOW = new Date('2026-10-06T15:00:00Z');

describe('StatementService (período do extrato)', () => {
  let repository: InMemoryTransactionRepository;
  let service: StatementService;

  beforeEach(() => {
    repository = new InMemoryTransactionRepository();
    service = new StatementService(repository, () => NOW);
  });

  const period = () => ({
    from: repository.lastQuery?.from.toISOString(),
    to: repository.lastQuery?.to.toISOString(),
  });

  it('sem datas: últimos 90 dias até o fim de hoje (horário de São Paulo)', async () => {
    await service.getStatement('u1', {});
    expect(period()).toEqual({
      from: '2026-07-08T03:00:00.000Z', // 08/07 00:00 em SP
      to: '2026-10-07T02:59:59.999Z', // 06/10 23:59:59.999 em SP
    });
  });

  it('intervalo customizado inclui o dia inteiro das duas pontas', async () => {
    await service.getStatement('u1', { from: '2026-09-01', to: '2026-09-30' });
    expect(period()).toEqual({
      from: '2026-09-01T03:00:00.000Z',
      to: '2026-10-01T02:59:59.999Z',
    });
  });

  it('só `from`: vai até hoje', async () => {
    await service.getStatement('u1', { from: '2026-09-01' });
    expect(period().to).toBe('2026-10-07T02:59:59.999Z');
  });

  it('só `to`: os 90 dias anteriores a ele', async () => {
    await service.getStatement('u1', { to: '2026-09-30' });
    expect(period().from).toBe('2026-07-02T03:00:00.000Z');
  });

  it('`from` depois de `to` → 400 apontando o campo', async () => {
    const error = await service
      .getStatement('u1', { from: '2026-10-02', to: '2026-10-01' })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(BadRequestError);
    expect((error as BadRequestError).details).toEqual([
      { field: 'from', message: 'A data inicial deve ser anterior ou igual à data final' },
    ]);
  });

  it('aceita até 366 dias e recusa 367', async () => {
    await expect(
      service.getStatement('u1', { from: '2025-10-06', to: '2026-10-06' }),
    ).resolves.toBeDefined();
    await expect(
      service.getStatement('u1', { from: '2025-10-05', to: '2026-10-06' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('devolve o período aplicado junto com os lançamentos', async () => {
    const statement = await service.getStatement('u1', {});
    expect(statement.from.toISOString()).toBe('2026-07-08T03:00:00.000Z');
    expect(statement.transactions).toEqual([]);
  });
});

describe('VolumeService (volume do dia)', () => {
  let repository: InMemoryTransactionRepository;

  async function add(type: 'PURCHASE' | 'SALE' | 'REINVESTMENT', btcSats: number, at: string) {
    const transaction = await repository.create({ userId: 'u1', type, amountCents: 1, btcSats });
    transaction.createdAt = new Date(at);
  }

  beforeEach(() => {
    repository = new InMemoryTransactionRepository();
  });

  it('soma compras e vendas de hoje (SP), ignorando reinvestimentos e outros dias', async () => {
    await add('PURCHASE', 1000, '2026-10-06T03:00:00Z'); // 00:00 de hoje em SP: conta
    await add('PURCHASE', 500, '2026-10-06T20:00:00Z');
    await add('SALE', 300, '2026-10-06T21:00:00Z');
    await add('REINVESTMENT', 9999, '2026-10-06T21:00:00Z'); // não é compra de mercado
    await add('PURCHASE', 7777, '2026-10-06T02:59:59Z'); // 23:59 de ONTEM em SP: não conta

    const volume = await new VolumeService(repository, () => NOW).getTodayVolume();

    expect(volume).toEqual({ date: '2026-10-06', boughtSats: 1500, soldSats: 300 });
  });
});
