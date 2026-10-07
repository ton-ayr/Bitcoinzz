import { describe, expect, it } from 'vitest';
import { isActivePath } from './nav';
import { relativeTime } from './time';

describe('relativeTime', () => {
  const now = new Date('2026-10-07T12:00:00Z');
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

  it.each([
    [0, 'agora'],
    [4, 'agora'],
    [12, 'há 12 s'],
    [59, 'há 59 s'],
    [60, 'há 1 min'],
    [3599, 'há 59 min'],
    [7200, 'há 2 h'],
  ])('%i s atrás → "%s"', (seconds, expected) => {
    expect(relativeTime(ago(seconds), now)).toBe(expected);
  });

  it('data no futuro (relógio adiantado) conta como "agora"', () => {
    expect(relativeTime(new Date(now.getTime() + 5000), now)).toBe('agora');
  });
});

describe('isActivePath (item ativo do menu)', () => {
  it('ativo na própria página e nas subpáginas', () => {
    expect(isActivePath('/dashboard', '/dashboard')).toBe(true);
    expect(isActivePath('/statement/123', '/statement')).toBe(true);
  });

  it('não confunde caminhos parecidos', () => {
    expect(isActivePath('/buyers', '/buy')).toBe(false);
    expect(isActivePath('/sell', '/buy')).toBe(false);
  });
});
