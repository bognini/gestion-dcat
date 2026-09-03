import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

type Db = Prisma.TransactionClient | typeof prisma;

/** Incrémente atomiquement le compteur `key` et retourne la nouvelle valeur. */
export async function nextSequenceValue(key: string, db: Db = prisma): Promise<number> {
  const rows = await db.$queryRaw<{ value: number }[]>`
    INSERT INTO "Sequence" ("key", "value", "updatedAt")
    VALUES (${key}, 1, NOW())
    ON CONFLICT ("key") DO UPDATE
      SET "value" = "Sequence"."value" + 1, "updatedAt" = NOW()
    RETURNING "value"`;
  return Number(rows[0].value);
}

/**
 * Génère une référence unique à partir d'un compteur monotone.
 * `format(n)` construit la référence ; `exists(ref)` permet de sauter les
 * références déjà utilisées (données historiques numérotées autrement).
 */
export async function nextReference(
  key: string,
  format: (n: number) => string,
  exists?: (ref: string) => Promise<boolean>,
  db: Db = prisma
): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const n = await nextSequenceValue(key, db);
    const ref = format(n);
    if (!exists || !(await exists(ref))) return ref;
  }
  throw new Error(`Impossible de générer une référence unique pour la séquence ${key}`);
}

export function pad(n: number, width = 4): string {
  return String(n).padStart(width, '0');
}
