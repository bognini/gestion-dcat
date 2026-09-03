import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { nextSequenceValue, nextReference, pad } from '@/lib/sequence';

// Tests d'intégration : nécessitent une base PostgreSQL migrée (DATABASE_URL).
// Ils sont ignorés automatiquement quand la base n'est pas joignable (CI sans DB).
const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
const key = `test:${Date.now()}`;

describe.skipIf(!dbOk)('séquences (intégration DB)', () => {
  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM "Sequence" WHERE "key" LIKE 'test:%'`;
    await prisma.$disconnect();
  });

  it('incrémente de façon monotone', async () => {
    const a = await nextSequenceValue(key);
    const b = await nextSequenceValue(key);
    expect(a).toBe(1);
    expect(b).toBe(2);
  });

  it('reste unique sous 30 appels concurrents', async () => {
    const values = await Promise.all(Array.from({ length: 30 }, () => nextSequenceValue(key + ':c')));
    expect(new Set(values).size).toBe(30);
    expect(Math.max(...values)).toBe(30);
  });

  it('saute les références déjà prises', async () => {
    const taken = new Set(['X-0001', 'X-0002']);
    const ref = await nextReference(key + ':s', (n) => `X-${pad(n)}`, async (r) => taken.has(r));
    expect(ref).toBe('X-0003');
  });
});

describe('pad', () => {
  it('complète avec des zéros', () => {
    expect(pad(7)).toBe('0007');
    expect(pad(12345)).toBe('12345');
    expect(pad(3, 5)).toBe('00003');
  });
});
